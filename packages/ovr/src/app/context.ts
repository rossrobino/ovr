import { Chunk } from "../jsx/chunk/index.js";
import { type JSX, toStream } from "../jsx/index.js";
import { type Params, Route } from "../trie/index.js";
import { hash } from "../util/hash.js";
import { type Middleware } from "./index.js";
import { Memo } from "./memo/index.js";

type Layout = (props: { children: JSX.Element }) => JSX.Element;

class TagNotFound extends Error {
	override name = "TagNotFound";

	constructor(tag: string) {
		super(`No closing ${tag} tag found`);
	}
}

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
	route: Route<Middleware<P>[]> | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#body) */
	body: BodyInit | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) */
	status?: number;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
	headers = new Headers();

	/** `layouts` for the `Page` to be passed into before being injected into the `<body>` */
	layouts: Layout[] = [];

	/** `JSX.Element`(s) to add to the head */
	head: JSX.Element[] = [];

	/**
	 * Middleware to run when no `body` or `status` has been set on the `context`.
	 * Set to a new function to override the default.
	 *
	 * @default
	 *
	 * ```ts
	 * (c) => {
	 * 	c.html("Not found", 404);
	 * 	c.headers.set("cache-control", "no-cache");
	 * }
	 * ```
	 */
	notFound: Middleware<P> = (c) => {
		c.html("Not found", 404);
		c.headers.set("cache-control", "no-cache");
	};

	/**
	 * Base HTML to inject the `head` and `page` elements into.
	 *
	 * If left empty, components will be returned as partials.
	 *
	 * @default ""
	 */
	base = "";

	/** `Memo` unique to the current `Request` context */
	memo = new Memo();

	static readonly #contentType = "content-type";
	static readonly #headClose = "</head>";
	static readonly #bodyClose = "</body>";

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
	 * Mirrors `new Response()` constructor, set values with one function.
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
	json(data: any, status?: number) {
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
		this.res(null, { status, headers: { location: location.toString() } });
	}

	/**
	 * Creates an HTML response based on the `head` elements, `Layout`(s), and `Page` provided.
	 *
	 * @param Page `JSX.Element` to inject into the `<body>`
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	page(Page: JSX.Element, status?: number) {
		for (let i = this.layouts.length - 1; i >= 0; i--) {
			// add layouts around the page in reverse order (1st is the root layout)
			Page = this.layouts[i]!({ children: Page });
		}

		if (this.base) {
			// inject into base
			const elements: JSX.Element[] = this.base.split(Context.#headClose);
			if (!elements[1]) throw new TagNotFound(Context.#headClose);

			elements.splice(1, 0, this.head, Context.#headClose);

			const bodyParts = (elements[3] as string).split(Context.#bodyClose);
			if (!bodyParts[1]) throw new TagNotFound(Context.#bodyClose);

			const userAgent = this.req.headers.get("user-agent");
			if (userAgent?.includes("Safari") && !userAgent.includes("Chrome")) {
				// https://bugs.webkit.org/show_bug.cgi?id=252413
				// https://github.com/sveltejs/kit/issues/10315
				// https://github.com/remix-run/remix/issues/5804
				bodyParts[0] += `<div aria-hidden=true style=position:absolute;width:0;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0>${"\u200b".repeat(200)}</div>`;
			}

			elements[3] = bodyParts[0];
			elements.push(Page, Context.#bodyClose + bodyParts[1]);

			return this.html(
				toStream(
					elements.map((el) => (typeof el === "string" ? Chunk.safe(el) : el)),
				),
				status,
			);
		}

		// HTML partial - just use the layouts + page
		// head elements are ignored if no base is set
		return this.html(toStream(Page), status);
	}

	/**
	 * Generates an etag from a hash of the string provided.
	 * If the etag matches, sets the response to not modified.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
	 *
	 * @param s string to hash
	 * @returns `true` if the etag matches, `false` otherwise
	 */
	etag(s: string) {
		const etag = `"${hash(s)}"`;

		this.headers.set("etag", etag);

		if (this.req.headers.get("if-none-match") === etag) {
			this.body = null;
			this.status = 304;

			return true;
		}

		return false;
	}

	/**
	 * Modifies the context based on the the return value of middleware.
	 *
	 * @param value value returned from middleware
	 */
	#resolveReturn(value: unknown) {
		if (value instanceof Response) {
			this.res(value.body, value);
		} else if (value instanceof ReadableStream) {
			this.body = value;
		} else if (value != null) {
			// nullish are not used so `void` will not render empty page
			this.page(value);
		}
	}

	/**
	 * Executes the stack of `middleware` provided.
	 *
	 * @param middleware stack to run
	 * @param i current middleware index (default `0`)
	 */
	async #dispatch(middleware: Middleware<P>[], i = 0) {
		if (!middleware[i]) return;

		this.#resolveReturn(
			await middleware[i](this, () => this.#dispatch(middleware, i + 1)),
		);
	}

	/**
	 * Composes a stack of `middleware` into a `Response`.
	 *
	 * @param middleware stack to compose
	 * @returns constructed `Response`
	 */
	async compose(middleware: Middleware<P>[]) {
		await this.#dispatch(middleware);

		if (!this.body && !this.status) this.notFound(this, Promise.resolve);

		return new Response(this.body, this);
	}
}
