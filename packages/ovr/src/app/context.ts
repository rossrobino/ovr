import { render } from "../jsx/index.js";
import { Route } from "../route/index.js";
import { type Params } from "../trie/index.js";
import { hash } from "../util/hash.js";
import { type Middleware } from "./index.js";

type PreparedResponse = {
	/**
	 * `body` used to create the `Response`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#body)
	 */
	body?: BodyInit | null;

	/**
	 * `status` used to create the `Response`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	status?: number;

	/**
	 * `Headers` used to create the `Response`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers)
	 */
	headers: Headers;
};

export class Context<P extends Params = Params> {
	/**
	 * Incoming `Request` to the server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request)
	 */
	readonly req: Request;

	/**
	 * Parsed `URL` created from `req.url`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL)
	 */
	readonly url: URL;

	/**
	 * Route pattern parameters
	 *
	 * Given the route pattern `/posts/:slug` is added, a request made to
	 * `/posts/my-post` creates a `params` object `{ slug: "my-post" }`.
	 *
	 * @example { slug: "my-post" }
	 */
	readonly params: P = {} as P; // set after match

	/** Matched `Route` instance. */
	readonly route?: Route;

	/** Contains the arguments to used create the final `Response`. */
	readonly res: PreparedResponse = { headers: new Headers() };

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
		c.res.headers.set("cache-control", "no-cache");
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
	 * Creates an HTML response.
	 *
	 * @param body HTML body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	html(body: BodyInit | null, status?: number) {
		this.res.body = body;
		this.res.status = status;
		this.res.headers.set(Context.#contentType, "text/html; charset=utf-8");
	}

	/**
	 * Creates a JSON response.
	 *
	 * @param data passed into JSON.stringify to create the body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	json(data: unknown, status?: number) {
		this.res.body = JSON.stringify(data);
		this.res.status = status;
		this.res.headers.set(Context.#contentType, "application/json");
	}

	/**
	 * Creates a plain text response.
	 *
	 * @param body response body
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	text(body: BodyInit, status?: number) {
		this.res.body = body;
		this.res.status = status;
		this.res.headers.set(Context.#contentType, "text/plain; charset=utf-8");
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
		this.res.body = null;
		this.res.status = status;
		this.res.headers.set("location", String(location));
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

		this.res.headers.set("etag", etag);

		if (this.req.headers.get("if-none-match") === etag) {
			this.res.body = null;
			this.res.status = 304;

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
			this.res.body = value.body;
			this.res.status = value.status;
			for (const [name, header] of value.headers) {
				this.res.headers.set(name, header);
			}
		} else if (value instanceof ReadableStream) {
			this.res.body = value;
		} else if (value !== undefined) {
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

		if (!this.res.body && !this.res.status) {
			this.notFound(this, Promise.resolve);
		}

		return new Response(this.res.body, this.res);
	}
}
