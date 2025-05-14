import { Trie, Route } from "../trie/index.js";
import type { Action } from "./action.js";
import { asyncLocalStorage } from "./async-local-storage.js";
import { Context } from "./context.js";

export type Params = Record<string, string>;

export type UnmatchedContext<P extends Params = Params> = Omit<
	Context<P>,
	"route"
> &
	Partial<Pick<Context<P>, "route">>;

export type Middleware<P extends Params = Params> = (
	context: Context<P>,
	next: () => Promise<void>,
) => unknown;

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

export class App {
	// allows for users to put other properties on the app
	[key: string]: any;

	/** Built tries per HTTP method. */
	#trieMap = new Map<Method, Trie<Middleware[]>>();

	/** Added routes per HTTP method. */
	#routesMap = new Map<Method, Route<Middleware[]>[]>();

	/** Global middleware. */
	#use: Middleware[] = [];

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
		} = {},
	) {
		this.#trailingSlash = config.trailingSlash ?? "never";
	}

	/**
	 * Add global middleware.
	 *
	 * @param middleware
	 * @returns the app instance
	 */
	use(...middleware: Middleware[]) {
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
		...middleware: Middleware<ExtractParams<Pattern>>[]
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
		...middleware: Middleware<ExtractMultiParams<Patterns>>[]
	): this;
	on<PatternOrPatterns extends string | string[]>(
		method: Method | Method[],
		pattern: PatternOrPatterns,
		...middleware: Middleware[]
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
		...middleware: Middleware<ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the app instance
	 */
	get<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<ExtractMultiParams<Patterns>>[]
	): this;
	get<PatternOrPatterns extends string | string[]>(
		patternOrPatterns: PatternOrPatterns,
		...middleware: Middleware[]
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
		...middleware: Middleware<ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	post<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<ExtractMultiParams<Patterns>>[]
	): this;
	/**
	 * @param action Result of `action()`
	 * @returns the app instance
	 */
	post(action: Action): this;
	post<PatternOrPatterns extends string | string[]>(
		patternOrAction: PatternOrPatterns | Action,
		...middleware: Middleware[]
	): this {
		if (typeof patternOrAction === "object" && "id" in patternOrAction)
			return this.post(patternOrAction.id, ...patternOrAction.middleware);

		return this.on("POST", patternOrAction as string, ...middleware);
	}

	/**
	 * @param req [`Request` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 * @returns [`Response` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response)
	 */
	fetch = (req: Request): Promise<Response> => {
		const c = new Context(req, new URL(req.url), this.#trailingSlash);

		return asyncLocalStorage.run(c, async () => {
			try {
				// check to see if the method is already built
				let trie = this.#trieMap.get(req.method);

				if (!trie) {
					// check if there are any routes with the method
					const routes = this.#routesMap.get(req.method);

					if (routes) {
						// build trie
						trie = new Trie<Middleware[]>();
						for (const route of routes) trie.add(route);
						this.#trieMap.set(req.method, trie);
					}
				}

				if (trie) {
					const match = trie.find(c.url.pathname);

					if (match) {
						Object.assign(c, match);

						const middleware = [...this.#use, ...match.route.store];

						// compose
						let i = -1;
						const dispatch = async (current: number): Promise<void> => {
							if (current <= i) throw new Error("next() called multiple times");
							i = current;

							if (middleware[current]) {
								const result = await middleware[current](c, () =>
									dispatch(current + 1),
								);

								if (result instanceof Response) c.res(result.body, result);
								else if (result instanceof ReadableStream) c.body = result;
								else if (result) c.page(result);
							}
						};

						await dispatch(0);
					}
				}
			} catch (error) {
				if (c.error) c.error(c, error);
				else throw error;
			}

			return c.build();
		});
	};
}
