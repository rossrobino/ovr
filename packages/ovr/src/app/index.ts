import { type Params, Route, Trie } from "../trie/index.js";
import type {
	DeepArray,
	ExtractMultiParams,
	ExtractParams,
} from "../types/index.js";
import { Context } from "./context.js";
import { Get } from "./helper/get.js";
import { Post } from "./helper/post.js";

export type Next = () => Promise<void>;

export type Middleware<P extends Params = Params> = (
	context: Context<P>,
	next: Next,
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

/** `App` configuration options */
type AppOptions = {
	/**
	 * Basic
	 * [cross-site request forgery (CSRF)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF)
	 * protection that checks the request's `method`, and its
	 * [`Sec-Fetch-Site`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)
	 * and [`Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin)
	 * headers.
	 *
	 * More robust protection requires a stateful server or a database to store
	 * [CSRF tokens](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF#csrf_tokens).
	 *
	 * @default true
	 */
	csrf?: boolean;

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
};

export class App {
	constructor(options?: AppOptions) {
		const resolved: Required<AppOptions> = {
			csrf: true,
			trailingSlash: "never",
		};
		Object.assign(resolved, options);

		if (resolved.csrf === true) this.#use.push(App.#csrf);

		if (resolved.trailingSlash !== "ignore") {
			this.#use.push(App.#trailingSlash(resolved.trailingSlash));
		}
	}

	/** Built tries per HTTP method. */
	#trieMap = new Map<Method, Trie<Middleware[]>>();

	/** Added routes per HTTP method. */
	#routesMap = new Map<Method, Route<Middleware[]>[]>();

	/** Global middleware. */
	#use: Middleware[] = [];

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

		// see if the method is already built
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

		if (trie) {
			const match = trie.find(c.url.pathname);

			if (match) {
				Object.assign(c, match);
				return c.build(this.#use.concat(match.route.store));
			}
		}

		// no match, just run global middleware
		return c.build(this.#use);
	};

	/** Basic CSRF middleware. */
	static async #csrf(c: Context, next: Next) {
		if (
			c.req.method === "GET" ||
			c.req.method === "HEAD" ||
			c.req.headers.get("sec-fetch-site") === "same-origin" ||
			c.req.headers.get("origin") === c.url.origin
		) {
			return next();
		}

		return c.text("Forbidden", 403);
	}

	/** @returns Trailing slash middleware */
	static #trailingSlash(mode: TrailingSlash) {
		return async (c: Context, next: Next) => {
			await next();

			if (c.status && c.status !== 404) return;

			const last = c.url.pathname.at(-1);

			if (mode === "always" && last !== "/") {
				c.url.pathname += "/";
				c.redirect(c.url, 308);
			} else if (mode === "never" && c.url.pathname !== "/" && last === "/") {
				c.url.pathname = c.url.pathname.slice(0, -1);
				c.redirect(c.url, 308);
			}
		};
	}
}
