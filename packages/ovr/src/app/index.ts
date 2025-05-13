import type { PostFormComponent } from "../components/form.js";
import { Trie, Route } from "../trie/index.js";
import { asyncLocalStorage } from "./async-local-storage.js";
import { Context } from "./context.js";

export type Params = Record<string, string>;

export type UnmatchedContext<S, P extends Params> = Omit<
	Context<S, P>,
	"route"
> &
	Partial<Pick<Context<S, P>, "route">>;

export type Start<S> = (
	context: Omit<UnmatchedContext<any, Params>, "state" | "route" | "params">,
) => S;

export type Middleware<S = null, P extends Params = Params> = (
	context: Context<S, P>,
	next: () => Promise<void>,
) => any;

export type TrailingSlash = "always" | "never" | "ignore";

type Method =
	| "GET"
	| "HEAD"
	| "POST"
	| "PUT"
	| "DELETE"
	| "CONNECT"
	| "OPTIONS"
	| "TRACE"
	| "PATCH"
	| (string & {});

type ExtractParams<Pattern extends string = string> =
	Pattern extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [k in Param | keyof ExtractParams<Rest>]: string }
		: Pattern extends `${infer _Start}:${infer Param}`
			? { [k in Param]: string }
			: Pattern extends `${infer _Rest}*`
				? { "*": string }
				: {};

type ExtractMultiParams<Patterns extends string[]> = Patterns extends [
	infer First extends string,
	...infer Rest extends string[],
]
	? Rest["length"] extends 0
		? ExtractParams<First>
		: ExtractParams<First> | ExtractMultiParams<Rest>
	: never;

export class App<S = null> {
	// allows for users to put other properties on the app
	[key: string]: any;

	/** Built tries per HTTP method. */
	#trieMap = new Map<Method, Trie<Middleware<S, Params>[]>>();

	/** Added routes per HTTP method. */
	#routesMap = new Map<Method, Route<Middleware<S, Params>[]>[]>();

	/** Global middleware. */
	#use: Middleware<S, Params>[] = [];

	#start?: Start<S>;
	#trailingSlash: TrailingSlash;

	constructor(
		config: {
			/**
			 * - `"never"` - Not found requests with a trailing slash will be redirected to the same path without a trailing slash
			 * - `"always"` - Not found requests without a trailing slash will be redirected to the same path with a trailing slash
			 * - `"ignore"` - no redirects (not recommended, bad for SEO)
			 *
			 * [Trailing Slash for Frameworks by Bjorn Lu](https://bjornlu.com/blog/trailing-slash-for-frameworks)
			 *
			 * @default "never"
			 */
			trailingSlash?: TrailingSlash;

			/**
			 * Runs before middleware, return a value to set the initial state.
			 *
			 * @param context request context
			 * @returns any state to access in middleware
			 * @default null
			 */
			start?: Start<S>;
		} = {},
	) {
		this.#trailingSlash = config.trailingSlash ?? "never";
		this.#start = config.start;
	}

	/**
	 * Add global middleware.
	 *
	 * @param middleware
	 * @returns the app instance
	 */
	use(...middleware: Middleware<S, Params>[]) {
		this.#use.push(...middleware);
		return this;
	}

	/**
	 * @param method HTTP method
	 * @param pattern route pattern
	 * @param middleware
	 * @returns the app instance
	 */
	on<Pattern extends string>(
		method: Method | Method[],
		pattern: Pattern,
		...middleware: Middleware<S, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param method HTTP method
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the app instance
	 */
	on<Patterns extends string[]>(
		method: Method | Method[],
		patterns: [...Patterns],
		...middleware: Middleware<S, ExtractMultiParams<Patterns>>[]
	): this;
	on<PatternOrPatterns extends string | string[]>(
		method: Method | Method[],
		pattern: PatternOrPatterns,
		...middleware: Middleware<S, Params>[]
	) {
		if (!Array.isArray(method)) method = [method];

		let patterns: string[];
		if (!Array.isArray(pattern)) patterns = [pattern];
		else patterns = pattern;

		for (const p of patterns) {
			const route = new Route(p, middleware);

			for (const m of method) {
				const routes = this.#routesMap.get(m);

				if (routes) routes.push(route);
				else this.#routesMap.set(m, [route]);
			}
		}

		return this;
	}

	/**
	 * @param pattern route pattern
	 * @param middleware
	 * @returns the app instance
	 */
	get<Pattern extends string>(
		pattern: Pattern,
		...middleware: Middleware<S, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the app instance
	 */
	get<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<S, ExtractMultiParams<Patterns>>[]
	): this;
	get<PatternOrPatterns extends string | string[]>(
		patternOrPatterns: PatternOrPatterns,
		...middleware: Middleware<S, Params>[]
	) {
		return this.on("GET", patternOrPatterns as string, ...middleware);
	}

	/**
	 * @param pattern route pattern
	 * @param middleware
	 * @returns the router instance
	 */
	post<Pattern extends string>(
		pattern: Pattern,
		...middleware: Middleware<S, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	post<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<S, ExtractMultiParams<Patterns>>[]
	): this;
	/**
	 * @param Form component returned from `form()`
	 * @returns the app instance
	 */
	post(Form: PostFormComponent): this;
	post<PatternOrPatterns extends string | string[]>(
		patternOrForm: PatternOrPatterns | PostFormComponent,
		...middleware: Middleware<S, Params>[]
	): this {
		if (typeof patternOrForm === "function")
			return this.post(patternOrForm.action, ...patternOrForm.middleware);

		return this.on("POST", patternOrForm as string, ...middleware);
	}

	/**
	 * @param req [`Request` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 * @returns [`Response` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response)
	 */
	fetch = (req: Request): Promise<Response> => {
		const c = new Context<S, Params>(
			req,
			new URL(req.url),
			this.#trailingSlash,
		);

		return asyncLocalStorage.run(c, async () => {
			try {
				if (this.#start) c.state = this.#start(c);

				// check to see if the method is already built
				let trie = this.#trieMap.get(req.method);

				if (!trie) {
					// check if there are any routes with the method
					const routes = this.#routesMap.get(req.method);

					if (routes) {
						// build trie
						trie = new Trie<Middleware<S, Params>[]>();
						for (const route of routes) trie.add(route);
						this.#trieMap.set(req.method, trie);
					}
				}

				if (trie) {
					const match = trie.find(c.url.pathname);

					if (match) {
						Object.assign(c, match);

						await this.#compose([...this.#use, ...match.route.store])(c, () =>
							Promise.resolve(),
						);
					}
				}
			} catch (error) {
				if (c.error) c.error(c, error);
				else throw error;
			}

			return c.build();
		});
	};

	/**
	 * Combines all middleware into a single function.
	 * Adapted from [koa-compose](https://github.com/koajs/compose/blob/master/index.js)
	 *
	 * @param middleware
	 * @returns single function middleware function
	 */
	#compose(middleware: Middleware<S, Params>[]): Middleware<S, Params> {
		return (c, next) => {
			let index = -1;

			const dispatch = async (i: number): Promise<void> => {
				if (i <= index) throw new Error("next() called multiple times");

				index = i;

				const mw = i === middleware.length ? next : middleware[i];

				if (!mw) return;

				return mw(c, dispatch.bind(null, i + 1));
			};

			return dispatch(0);
		};
	}
}
