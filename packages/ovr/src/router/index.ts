import { Trie, Route } from "../trie/index.js";
import { Context } from "./context.js";
import { asyncLocalContext } from "./get-context.js";

export type Params = Record<string, string>;

export type UnmatchedContext<State, P extends Params> = Omit<
	Context<State, P>,
	"route"
> &
	Partial<Pick<Context<State, P>, "route">>;

export type Start<State> = (
	context: Omit<UnmatchedContext<any, Params>, "state" | "route" | "params">,
) => State;

export type Middleware<State = null, P extends Params = Params> = (
	context: Context<State, P>,
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

export class Router<State = null> {
	// allows for users to put other properties on the router
	[key: string]: any;

	/** Built tries per HTTP method */
	#trieMap = new Map<Method, Trie<Middleware<State, Params>[]>>();

	/** Added routes per HTTP method */
	#routesMap = new Map<Method, Route<Middleware<State, Params>[]>[]>();

	/** Global middleware */
	#use: Middleware<State, Params>[] = [];

	#start?: Start<State>;
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
			start?: Start<State>;
		} = {},
	) {
		this.#trailingSlash = config.trailingSlash ?? "never";
		this.#start = config.start;
		this.fetch = this.fetch.bind(this);
	}

	/**
	 * Add global middleware.
	 *
	 * @param middleware
	 * @returns the router instance
	 */
	use(...middleware: Middleware<State, Params>[]) {
		this.#use.push(...middleware);
		return this;
	}

	/**
	 * @param method HTTP method
	 * @param pattern route pattern
	 * @param middleware
	 * @returns the router instance
	 */
	on<Pattern extends string>(
		method: Method | Method[],
		pattern: Pattern,
		...middleware: Middleware<State, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param method HTTP method
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	on<Patterns extends string[]>(
		method: Method | Method[],
		patterns: [...Patterns],
		...middleware: Middleware<State, ExtractMultiParams<Patterns>>[]
	): this;
	on<PatternOrPatterns extends string | string[]>(
		method: Method | Method[],
		pattern: PatternOrPatterns,
		...middleware: Middleware<State, Params>[]
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
	 * @returns the router instance
	 */
	get<Pattern extends string>(
		pattern: Pattern,
		...middleware: Middleware<State, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	get<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<State, ExtractMultiParams<Patterns>>[]
	): this;
	get<PatternOrPatterns extends string | string[]>(
		patternOrPatterns: PatternOrPatterns,
		...middleware: Middleware<State, Params>[]
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
		...middleware: Middleware<State, ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	post<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<State, ExtractMultiParams<Patterns>>[]
	): this;
	post<PatternOrPatterns extends string | string[]>(
		patternOrPatterns: PatternOrPatterns,
		...middleware: Middleware<State, Params>[]
	) {
		return this.on("POST", patternOrPatterns as string, ...middleware);
	}

	/**
	 * @param basePattern pattern to mount the router to, each route will begin with this base
	 * @param router sub-router to mount
	 * @returns the base router instance
	 */
	mount(basePattern: string, router: Router<State>) {
		if (basePattern.at(-1) === "/") basePattern = basePattern.slice(0, -1);

		router.#routesMap.forEach((routes, method) => {
			for (const route of routes) {
				if (
					this.#trailingSlash !== "always" &&
					route.pattern === "/" &&
					basePattern !== ""
				) {
					route.pattern = "";
				}

				this.on(method, basePattern + route.pattern, ...route.store);
			}
		});

		return this;
	}

	/**
	 * @param req [`Request` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 * @returns [`Response` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response)
	 */
	fetch(req: Request): Promise<Response> {
		const c = new Context<State, Params>(
			req,
			new URL(req.url),
			this.#trailingSlash,
		);

		return asyncLocalContext.run(c, async () => {
			try {
				if (this.#start) c.state = this.#start(c);

				let trie = this.#trieMap.get(req.method);

				if (!trie) {
					const routes = this.#routesMap.get(req.method);

					if (routes) {
						// build trie
						trie = new Trie<Middleware<State, Params>[]>();
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
	}

	/**
	 * Combines all middleware into a single function.
	 * Adapted from [koa-compose](https://github.com/koajs/compose/blob/master/index.js)
	 *
	 * @param middleware
	 * @returns single function middleware function
	 */
	#compose(middleware: Middleware<State, Params>[]): Middleware<State, Params> {
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
