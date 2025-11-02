import { type Params, Route, Trie } from "../trie/index.js";
import type {
	DeepArray,
	ExtractMultiParams,
	ExtractParams,
} from "../types/index.js";
import { Context } from "./context.js";
import { Get } from "./helper/get.js";
import { Post } from "./helper/post.js";

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

export class App {
	// allows for users to put other properties on the app
	[key: string | symbol | number]: any;

	/** Built tries per HTTP method. */
	#trieMap = new Map<Method, Trie<Middleware[]>>();

	/** Added routes per HTTP method. */
	#routesMap = new Map<Method, Route<Middleware[]>[]>();

	/** Global middleware added by `use`. */
	#globalMiddleware: Middleware[] = [];

	/**
	 * @param helpers `Helper` to add to `App`
	 * @returns `App` instance
	 */
	add(...helpers: DeepArray<Get | Post | Record<string, Get | Post>>[]) {
		for (const helper of helpers) {
			if (helper instanceof Array) {
				this.add(...helper);
			} else if (helper instanceof Get) {
				this.get(helper.pattern, ...helper.middleware);
			} else if (helper instanceof Post) {
				this.post(helper.pattern, ...helper.middleware);
			} else {
				this.add(...Object.values(helper));
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
		this.#globalMiddleware.push(...middleware);
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
	 * Request a resource from the application.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)
	 *
	 * @param resource [Resource](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#resource) to fetch
	 * @param options [Options](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#options) to apply to the request
	 * @returns Promise that resolves to the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) to the request
	 */
	fetch = async (
		resource: RequestInfo | URL,
		options?: RequestInit,
	): Promise<Response> => {
		const c = new Context(new Request(resource, options));

		// check to see if the method is already built
		let trie = this.#trieMap.get(c.req.method);

		if (!trie) {
			// check if there are any routes with the method
			const routes = this.#routesMap.get(c.req.method);

			if (routes) {
				// build trie
				trie = new Trie<Middleware[]>();
				for (const route of routes) trie.add(route);
				this.#trieMap.set(c.req.method, trie);
			}
		}

		const middleware = [...this.#globalMiddleware];

		if (trie) {
			const match = trie.find(c.url.pathname);

			if (match) {
				Object.assign(c, match);
				middleware.push(...match.route.store);
			}
		}

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
				else if (result != null) c.page(result);
			}
		};

		await dispatch(0);

		return c.build();
	};
}
