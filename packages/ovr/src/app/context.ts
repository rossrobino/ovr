import { render } from "../jsx/index.js";
import { Route } from "../route/index.js";
import { type Params } from "../trie/index.js";
import { hash } from "../util/hash.js";
import { type Middleware } from "./index.js";

export class Context<P extends Params = Params> {
	/**
	 * Incoming `Request` to the server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 */
	req: Request;

	/**
	 * Parsed `URL` created from `req.url`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL)
	 */
	url: URL;

	/**
	 * Route pattern parameters
	 *
	 * Given the route pattern `/posts/:slug` is added, a request made to
	 * `/posts/my-post` creates a `params` object `{ slug: "my-post" }`.
	 *
	 * @example { slug: "my-post" }
	 */
	params: P = {} as P; // set after match

	/** Matched `Route` instance. */
	route: Route | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#body) */
	body: BodyInit | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) */
	status?: number;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
	headers = new Headers();

	/**
	 * Middleware to run when no `body` or `status` has been set on the `context`.
	 * Set to a new function to override the default.
	 *
	 * @default
	 *
	 * ```ts
	 * (c) => {
	 * 	c.text("Not found", 404);
	 * 	c.headers.set("cache-control", "no-cache");
	 * }
	 * ```
	 */
	notFound: Middleware<P> = (c) => {
		c.text("Not found", 404);
		c.headers.set("cache-control", "no-cache");
	};

	static readonly #contentType = "content-type";

	/**
	 * Creates a new `Context` with the current `Request`.
	 *
	 * @param req Request
	 */
	constructor(req: Request) {
		this.req = req;
		this.url = new URL(req.url);
	}

	/**
	 * Prepare a response, mirrors `new Response()` constructor
	 *
	 * @param body Response BodyInit
	 * @param init ResponseInit
	 */
	res(
		body: BodyInit | null,
		init?: {
			/**
			 * [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
			 *
			 * @default 200
			 */
			status?: number;

			/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
			headers?: HeadersInit;
		},
	) {
		this.body = body;
		this.status = init?.status ?? 200;

		if (init?.headers) {
			for (const [name, value] of new Headers(init.headers)) {
				this.headers.set(name, value);
			}
		}
	}

	/**
	 * Creates an HTML response.
	 *
	 * @param body HTML body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	html(body: BodyInit | null, status?: number) {
		this.res(body, {
			status,
			headers: { [Context.#contentType]: "text/html; charset=utf-8" },
		});
	}

	/**
	 * Creates a JSON response.
	 *
	 * @param data passed into JSON.stringify to create the body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	json(data: unknown, status?: number) {
		this.res(JSON.stringify(data), {
			status,
			headers: { [Context.#contentType]: "application/json" },
		});
	}

	/**
	 * Creates a plain text response.
	 *
	 * @param body response body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	text(body: BodyInit, status?: number) {
		this.res(body, {
			status,
			headers: { [Context.#contentType]: "text/plain; charset=utf-8" },
		});
	}

	/**
	 * Creates a redirect response.
	 *
	 * @param location redirect `Location` header
	 * @param status HTTP status code
	 *
	 * - [301 Moved Permanently](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301)
	 * - [302 Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302) (default)
	 * - [303 See Other](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/303)
	 * - [307 Temporary Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/307)
	 * - [308 Permanent Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/308)
	 */
	redirect(location: string | URL, status: 301 | 302 | 303 | 307 | 308 = 302) {
		this.res(null, { status, headers: { location: String(location) } });
	}

	/**
	 * Generates an etag from a hash of the string provided.
	 * If the etag matches, sets the response to not modified.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
	 *
	 * @param string string to hash
	 * @returns `true` if the etag matches, `false` otherwise
	 */
	etag(string: string) {
		const etag = `"${hash(string)}"`;

		this.headers.set("etag", etag);

		if (this.req.headers.get("if-none-match") === etag) {
			this.body = null;
			this.status = 304;

			return true;
		}

		return false;
	}

	/**
	 * Dispatches the stack of `middleware` provided.
	 *
	 * @param middleware stack to run
	 * @param i current middleware index (default `0`)
	 * @returns return value of `middleware[i]`
	 */
	async #run(middleware: Middleware<P>[], i = 0) {
		const mw = middleware[i];

		if (!mw) return; // end of stack

		const value: unknown = await mw(
			this, // c
			() => this.#run(middleware, i + 1), // next
		);

		// resolve the final return value
		if (value instanceof Response) {
			this.res(value.body, value);
		} else if (value instanceof ReadableStream) {
			this.body = value;
		} else if (value !== undefined) {
			// don't assign void return value
			this.html(render.stream(value));
		}
	}

	/**
	 * Composes a stack of `middleware` into a `Response`.
	 *
	 * @param middleware stack to compose
	 * @returns constructed `Response`
	 */
	async build(middleware: Middleware<P>[]) {
		await this.#run(middleware);

		if (!this.body && !this.status) this.notFound(this, Promise.resolve);

		return new Response(this.body, this);
	}
}
