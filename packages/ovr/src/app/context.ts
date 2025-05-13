import { head } from "../components/index.js";
import { hash } from "../hash/index.js";
import { toGenerator, type JSX } from "../jsx/index.js";
import { Memo } from "../memo/index.js";
import type { Route } from "../trie/index.js";
import type {
	Middleware,
	Params,
	TrailingSlash,
	UnmatchedContext,
} from "./index.js";

type Layout = (props: { children: JSX.Element }) => JSX.Element;

class TagNotFound extends Error {
	constructor(tag: string) {
		super(`No closing ${tag} tag found`);
		this.name = "TagNotFound";
	}
}

export class Context<S, P extends Params> {
	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request) */
	req: Request;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL) */
	url: URL;

	/**
	 * `state` returned from `config.start`, possibly modified by previous middleware.
	 *
	 * @default null
	 */
	state: S = null as S;

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
	route: Route<Middleware<S, P>[]> = undefined as any; // set after match

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#body) */
	body: BodyInit | null = null;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) */
	status?: number;

	/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
	headers = new Headers();

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
	error:
		| ((context: UnmatchedContext<S, Params>, error: unknown) => any)
		| null = null;

	#layouts: Layout[] = [];
	#headElements: JSX.Element[] = [];
	#trailingSlash: TrailingSlash;

	#memo = new Memo();
	memo = this.#memo.use;

	constructor(req: Request, url: URL, trailingSlash: TrailingSlash) {
		this.req = req;
		this.url = url;
		this.#trailingSlash = trailingSlash;
	}

	/**
	 * Middleware to run when no `body` or `status` has been set on the `context`.
	 * Set to a new function to override the default.
	 *
	 * @default
	 *
	 * ```ts
	 * () => this.html("Not found", 404)
	 * ```
	 */
	notFound(_context: UnmatchedContext<S, P>): any {
		this.html("Not found", 404);
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
				this.headers.append(name, value);
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
	 * @param status defaults to [`302`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)
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

		elements.splice(1, 0, this.#headElements, head + headClose);

		const bodyParts = (elements[3] as string).split(bodyClose);
		if (!bodyParts[1]) throw new TagNotFound(bodyClose);

		// https://bugs.webkit.org/show_bug.cgi?id=252413
		// https://github.com/sveltejs/kit/issues/10315
		bodyParts[0] += `<div aria-hidden=true style=position:absolute;width:0;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0>${"/".repeat(200)}</div>`;

		elements[3] = bodyParts[0];
		elements.push(Page, bodyClose + bodyParts[1]);

		this.html(
			new ReadableStream<string>({
				async start(c) {
					for await (const value of toGenerator(elements)) c.enqueue(value);
					c.close();
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
}
