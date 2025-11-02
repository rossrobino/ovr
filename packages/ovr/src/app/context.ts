import { Chunk } from "../jsx/chunk/index.js";
import { type JSX, toStream } from "../jsx/index.js";
import { type Params, Route } from "../trie/index.js";
import { hash } from "../util/hash.js";
import { type Middleware, type TrailingSlash } from "./index.js";
import { Memo } from "./memo/index.js";

type Layout = (props: { children: JSX.Element }) => JSX.Element;

class TagNotFound extends Error {
	override name = "TagNotFound";
	constructor(tag: string) {
		super(`No closing ${tag} tag found`);
	}
}

export class Context<P extends Params = Params> {
	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request) */
	req: Request;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL) */
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

	/** The matched `Route` instance. */
	route: Route<Middleware<P>[]> = new Route<Middleware<P>[]>(null, []);

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
	 * Middleware to run when no `body` or `status` has been set on the `context`.
	 * Set to a new function to override the default.
	 *
	 * @default
	 *
	 * ```ts
	 * (c) => c.html("Not found", 404)
	 * ```
	 */
	notFound: Middleware<P> = (c) => c.html("Not found", 404);

	/**
	 * Base HTML to inject the `head` and `page` elements into.
	 *
	 * If left empty, components will be returned as partials.
	 *
	 * @default ""
	 */
	base = "";

	/** `Memo` unique to the current `Request` context */
	#memo = new Memo();

	memo = this.#memo.use;

	static readonly #contentType = "content-type";
	static readonly #headClose = "</head>";
	static readonly #bodyClose = "</body>";

	constructor(req: Request) {
		this.req = req;
		this.url = new URL(req.url);
	}

	/**
	 * Mirrors `new Response()` constructor, set values with one function.
	 *
	 * @param body Response BodyInit
	 * @param init Enhanced ResponseInit
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

		let element: JSX.Element;

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

			element = elements.map((el) =>
				typeof el === "string" ? Chunk.safe(el) : el,
			);
		} else {
			element = Page;
		}

		// HTML partial - just use the layouts + page
		// head elements are ignored if no base is set
		return this.html(toStream(element), status);
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
	 * @returns the constructed `Response`
	 */
	build() {
		if (
			(!this.status || this.status === 404) &&
			this.trailingSlash !== "ignore"
		) {
			const last = this.url.pathname.at(-1);

			if (this.trailingSlash === "always" && last !== "/") {
				this.url.pathname += "/";
				this.redirect(this.url, 308);
			} else if (
				this.trailingSlash === "never" &&
				this.url.pathname !== "/" &&
				last === "/"
			) {
				this.url.pathname = this.url.pathname.slice(0, -1);
				this.redirect(this.url, 308);
			}
		}

		if (!this.body && !this.status) this.notFound(this, Promise.resolve);

		return new Response(this.body, this);
	}
}
