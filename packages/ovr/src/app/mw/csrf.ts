import type { Middleware } from "../index.js";

/**
 * Basic CSRF protection that checks the request's `method` and `Origin` header.
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
