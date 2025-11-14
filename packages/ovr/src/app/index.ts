import { Get, Post, Route } from "../route/index.js";
import { type Params, Trie } from "../trie/index.js";
import type { DeepArray } from "../types/index.js";
import { Context } from "./context.js";

/** Dispatches the next middleware in the stack */
export type Next = () => Promise<void>;

/** App middleware */
export type Middleware<P extends Params = Params> = (
	context: Context<P>,
	next: Next,
) => any;

/** Trailing slash preference */
export type TrailingSlash = "always" | "never" | "ignore";

/** HTTP Method */
export type Method =
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

/** Helper type for anything that can be passed into `App.use` */
type Use = Route | Get | Post | Middleware;

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

/** Web server application. */
export class App {
	/**
	 * Create a new application.
	 *
	 * @param options configuration options
	 */
	constructor(options?: AppOptions) {
		const resolved: Required<AppOptions> = {
			csrf: true,
			trailingSlash: "never",
		};
		Object.assign(resolved, options);

		if (resolved.csrf === true) this.#global.push(App.#csrf);

		if (resolved.trailingSlash !== "ignore") {
			this.#global.push(App.#createTrailingSlash(resolved.trailingSlash));
		}
	}

	/** Route trie */
	#trie = new Trie();

	/** Global middleware */
	#global: Middleware[] = [];

	/**
	 * @param routes Route or middleware to use
	 * @returns `App` instance
	 */
	use(...routes: DeepArray<Use | Record<string, Use>>[]) {
		for (const route of routes) {
			if (route instanceof Route) {
				this.#trie.add(route);
			} else if (route instanceof Array) {
				this.use(...route);
			} else if (typeof route === "function") {
				this.#global.push(route);
			} else {
				this.use(...Object.values(route));
			}
		}

		return this;
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
		const match = this.#trie.find(c.req.method + c.url.pathname);

		if (match) {
			return Object.assign(c, match).build(
				this.#global.concat(match.route.middleware),
			);
		}

		// no match, just run global middleware
		return c.build(this.#global);
	};

	/** Basic CSRF middleware */
	static async #csrf(c: Context, next: Next) {
		if (
			c.req.method === "GET" ||
			c.req.method === "HEAD" ||
			c.req.headers.get("sec-fetch-site") === "same-origin" ||
			c.req.headers.get("origin") === c.url.origin
		) {
			return next();
		}

		c.text("Forbidden", 403);
	}

	/** @returns Trailing slash middleware */
	static #createTrailingSlash(mode: TrailingSlash) {
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
