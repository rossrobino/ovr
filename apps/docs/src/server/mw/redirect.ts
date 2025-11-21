import type { Middleware } from "ovr";

const route = "04-route";

const permanent: Record<string, string> = {
	"/04-helpers": route,
	"/06-routing": route,
	"/05-context": "05-middleware#context",
	"/07-memo": "https://blog.robino.dev/posts/simple-memo",
};

export const redirect: Middleware = async (c, next) => {
	await next();

	const to = permanent[c.url.pathname];

	if (to) c.redirect(to, 301);
};
