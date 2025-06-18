import { Route, Trie } from "../trie/index.js";
import type {
	DeepArray,
	ExtractMultiParams,
	ExtractParams,
} from "../types/index.js";
import { Action } from "./action.js";
import { Context } from "./context.js";
import { Page } from "./page.js";
import { AsyncLocalStorage } from "node:async_hooks";

export type Params = Record<string, string>;

export type Middleware<P extends Params = Params> = (
	context: Context<P>,
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

type UnmatchedContext<P extends Params = Params> = Omit<Context<P>, "route"> &
	// route might be defined
	Partial<Pick<Context<P>, "route">>;

export type ErrorHandler<P extends Params = Params> =
	| ((context: UnmatchedContext<P>, error: unknown) => any)
	| null;

export type NotFoundHandler<P extends Params = Params> = (
	context: UnmatchedContext<P>,
) => any;

export class App {
	// allows for users to put other properties on the app
	[key: string | symbol | number]: any;

	/** Built tries per HTTP method. */
	#trieMap = new Map<Method, Trie<Middleware[]>>();

	/** Added routes per HTTP method. */
	#routesMap = new Map<Method, Route<Middleware[]>[]>();

	/** Global middleware. */
	#use: Middleware[] = [];

	/**
	 * - `"never"` - Not found requests with a trailing slash will be redirected to the same path without a trailing slash
	 * - `"always"` - Not found requests without a trailing slash will be redirected to the same path with a trailing slash
	 * - `"ignore"` - no redirects (not recommended, bad for SEO)
	 *
	 * [Trailing Slash for Frameworks by Bjorn Lu](https://bjornlu.com/blog/trailing-slash-for-frameworks)
	 *
	 * @default "never"
	 */
	trailingSlash: TrailingSlash = "never";

	/**
	 * Base HTML to inject the `head` and `page` elements into.
	 *
	 * @default
	 *
	 * ```html
	 * <!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>
	 * ```
	 */
	base =
		'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';

	/**
	 * Assign a handler to run when an `Error` is thrown.
	 *
	 * If not set, `Error` will be thrown. This might be desired
	 * if your server already includes error handling. Set in `config.start`
	 * to handle errors globally.
	 *
	 * @default null
	 */
	error: ErrorHandler = null;

	/**
	 * Middleware to run when no `body` or `status` has been set on the `context`.
	 * Set to a new function to override the default.
	 *
	 * @default
	 *
	 * ```ts
	 * (c) => c.html("Not found", 404)
	 * ```
	 */
	notFound: NotFoundHandler = (c) => c.html("Not found", 404);

	/** Stores context per request. */
	static storage = new AsyncLocalStorage<Context>();

	/**
	 * @param routes `Page`s or `Action`s to add to the `App`
	 * @returns `App` instance
	 */
	add(...routes: DeepArray<Page | Action | Record<string, Page | Action>>[]) {
		for (const route of routes) {
			if (route instanceof Array) {
				this.add(...route);
			} else if (route instanceof Page) {
				this.get(route.pattern, ...route.middleware);
			} else if (route instanceof Action) {
				this.post(route.pattern, ...route.middleware);
			} else {
				this.add(...Object.values(route));
			}
		}

		return this;
	}

	/**
	 * Add global middleware.
	 *
	 * @param middleware
	 * @returns `App` instance
	 */
	use(...middleware: Middleware[]) {
		this.#use.push(...middleware);
		return this;
	}

	/**
	 * @param method HTTP method
	 * @param pattern Route pattern
	 * @param middleware
	 * @returns `App` instance
	 */
	on<Pattern extends string>(
		method: Method | Method[],
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param method HTTP method
	 * @param patterns Array of route patterns
	 * @param middleware
	 * @returns `App` instance
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
	 * @param pattern Route pattern
	 * @param middleware
	 * @returns `App` instance
	 */
	get<Pattern extends string>(
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns Array of route patterns
	 * @param middleware
	 * @returns `App` instance
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
	 * @param pattern Route pattern
	 * @param middleware
	 * @returns the router instance
	 */
	post<Pattern extends string>(
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	): this;
	/**
	 * @param patterns Array of route patterns
	 * @param middleware
	 * @returns the router instance
	 */
	post<Patterns extends string[]>(
		patterns: [...Patterns],
		...middleware: Middleware<ExtractMultiParams<Patterns>>[]
	): this;
	post<PatternOrPatterns extends string | string[]>(
		patternOrPatterns: PatternOrPatterns,
		...middleware: Middleware[]
	): this {
		return this.on("POST", patternOrPatterns as string, ...middleware);
	}

	/**
	 * @param req [`Request` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 * @returns [`Response` Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response)
	 */
	fetch = (req: Request): Promise<Response> => {
		const c = new Context(
			req,
			new URL(req.url),
			this.trailingSlash,
			this.base,
			this.error,
			this.notFound,
		);

		return App.storage.run(c, async () => {
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
								const result: unknown = await middleware[current](c, () =>
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
