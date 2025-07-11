import type { Middleware } from "../index.js";

/**
 * Basic
 * [cross-site request forgery (CSRF)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF)
 * protection that checks the request's `method` and `Origin` header.
 * For more robust protection you'll need a stateful server or a database to store
 * [CSRF tokens](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF#csrf_tokens).
 *
 * @param options
 * @returns CSRF middleware
 *
 * @example
 *
 * ```ts
 * import { csrf } from "ovr";
 *
 * app.use(csrf({ origin: "https://example.com" }));
 * ```
 */
export const csrf = (options: { origin: string | string[] }): Middleware => {
	if (typeof options.origin === "string") options.origin = [options.origin];

	return (c, next) => {
		if (["GET", "HEAD"].includes(c.req.method)) return next();

		const origin = c.req.headers.get("Origin");
		if (origin && options.origin.includes(origin)) return next();

		return c.text("Forbidden", 403);
	};
};
