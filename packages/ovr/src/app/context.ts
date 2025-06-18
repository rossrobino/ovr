import { Chunk } from "../jsx/chunk/index.js";
import { type JSX, toGenerator } from "../jsx/index.js";
import type { Route } from "../trie/index.js";
import { hash } from "../util/hash.js";
import {
	App,
	type ErrorHandler,
	type Middleware,
	type NotFoundHandler,
	type Params,
	type TrailingSlash,
} from "./index.js";
import { Memo } from "./memo/index.js";

type Layout = (props: { children: JSX.Element }) => JSX.Element;

class TagNotFound extends Error {
	constructor(tag: string) {
		super(`No closing ${tag} tag found`);
		this.name = "TagNotFound";
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
	params!: P; // set after match

	/** The matched `Route` instance. */
	route!: Route<Middleware<P>[]>; // set after match

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#body) */
	body: BodyInit | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) */
	status?: number;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
	headers = new Headers();

	#layouts: Layout[] = [];

	#headElements: JSX.Element[] = [];

	#trailingSlash: TrailingSlash;

	/** Passed from `app.base` */
	base: string;

	/** Passed from `app.error` */
	error: ErrorHandler<P>;

	/** Passed from `app.notFound` */
	notFound: NotFoundHandler<P>;

	#memo = new Memo();

	memo = this.#memo.use;

	constructor(
		req: Request,
		url: URL,
		trailingSlash: TrailingSlash,
		base: string,
		error: ErrorHandler<P>,
		notFound: NotFoundHandler<P>,
	) {
		this.req = req;
		this.url = url;
		this.#trailingSlash = trailingSlash;
		this.base = base;
		this.error = error;
		this.notFound = notFound;
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
			headers: { "content-type": "text/html; charset=utf-8" },
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
			headers: { "content-type": "application/json" },
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
			headers: { "content-type": "text/plain; charset=utf-8" },
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
		this.headers.set("location", location.toString());
		this.status = status;
	}

	/**
	 * @param Element `JSX.Element` to add to the head
	 */
	head(...Element: JSX.Element[]) {
		this.#headElements.push(...Element);
	}

	/**
	 * @param Layout `Layout`(s) for the `Page` to be passed into before being injected into the `<body>`
	 */
	layout(...Layout: Layout[]) {
		this.#layouts.push(...Layout);
	}

	/**
	 * Creates an HTML response based on the `head` elements, `Layout`(s), and `Page` provided.
	 *
	 * @param Page `JSX.Element` to inject into the `<body>`
	 * @param status [HTTP response status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	 */
	page(Page: JSX.Element, status?: number) {
		for (let i = this.#layouts.length - 1; i >= 0; i--)
			Page = this.#layouts[i]!({ children: Page });

		const headClose = "</head>";
		const bodyClose = "</body>";

		const elements: JSX.Element[] = this.base.split(headClose);
		if (!elements[1]) throw new TagNotFound(headClose);

		elements.splice(1, 0, this.#headElements, headClose);

		const bodyParts = (elements[3] as string).split(bodyClose);
		if (!bodyParts[1]) throw new TagNotFound(bodyClose);

		const userAgent = this.req.headers.get("user-agent");
		if (userAgent?.includes("Safari") && !userAgent.includes("Chrome")) {
			// https://bugs.webkit.org/show_bug.cgi?id=252413
			// https://github.com/sveltejs/kit/issues/10315
			// https://github.com/remix-run/remix/issues/5804
			bodyParts[0] += `<div aria-hidden=true style=position:absolute;width:0;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0>${"\u200b".repeat(200)}</div>`;
		}

		elements[3] = bodyParts[0];
		elements.push(Page, bodyClose + bodyParts[1]);

		const gen = toGenerator(
			elements.map((el) => {
				if (typeof el === "string") return new Chunk(el, true);
				return el;
			}),
		);

		this.html(
			new ReadableStream<string>({
				async pull(c) {
					const { value, done } = await gen.next();
					if (done) c.close();
					else c.enqueue(value?.value);
				},

				cancel() {
					gen.return();
				},
			}).pipeThrough(new TextEncoderStream()),
			status,
		);
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
			this.#trailingSlash !== "ignore"
		) {
			const last = this.url.pathname.at(-1);

			if (this.#trailingSlash === "always" && last !== "/") {
				this.url.pathname += "/";
				this.redirect(this.url, 308);
			} else if (
				this.#trailingSlash === "never" &&
				this.url.pathname !== "/" &&
				last === "/"
			) {
				this.url.pathname = this.url.pathname.slice(0, -1);
				this.redirect(this.url, 308);
			}
		}

		if (!this.body && !this.status) this.notFound(this);

		return new Response(this.body, this);
	}

	/**
	 * Call within the scope of a handler to get the current context.
	 *
	 * @returns Request context
	 *
	 * @example
	 *
	 * ```ts
	 * import { Context } from "ovr";
	 *
	 * const app = new Router();
	 *
	 * const fn = () => {
	 * 	const c = Context.get();
	 * 	// ...
	 * }
	 *
	 * app.get("/", () => {
	 * 	fn(); // OK
	 * });
	 *
	 * fn() // ReferenceError - outside AsyncLocalStorage scope
	 * ```
	 */
	static get() {
		const c = App.storage.getStore();

		if (!c)
			throw new ReferenceError(
				"Context can only be obtained within a handler.",
			);

		return c;
	}
}
