import { bench, run, summary } from "mitata";
import * as o from "ovr";

async function Async() {
	return o.jsx("p", { children: "Async" });
}

function* Component() {
	for (let r = 0; r < 500; r++) {
		yield o.jsx("div", { children: [r, o.jsx(Async, { class: "text-sm" })] });
	}
}

summary(() => {
	bench("generate 500", async () => {
		const gen = o.render(o.jsx(Component, {}));
		for await (const _r of gen);
	}).gc("inner");
});

const app = new o.App();

app.use(
	new o.Get("/", () => "home"),
	new o.Get("/test", () => "test"),
	new o.Get("/:slug", (c) => c.params.slug),
	new o.Get("/test/:slug", (c) => c.params.slug),
	new o.Get("/posts", (c) => c.text("posts")),
	new o.Get(
		"/posts/:postId/comments",
		(c) => `comments for ${c.params.postId}`,
	),
	new o.Get(
		"/posts/:postId/comments/:commentId",
		(c) => `comment ${c.params.commentId} on post ${c.params.postId}`,
	),
	new o.Get("/api/users", () => "users index"),
	new o.Get("/api/users/:id", (c) => `user ${c.params.id}`),
	new o.Get("/static/*", (c) => `static ${c.params["*"] ?? ""}`),
	new o.Get("/assets/:type/:name", (c) => `${c.params.type}/${c.params.name}`),
	new o.Get("/files/:path", (c) => `file ${c.params.path}`),
	new o.Post("/api/users", async (c) => {
		return c.json({ created: true });
	}),
);

summary(() => {
	bench("router - match various routes", async () => {
		const paths = [
			"/",
			"/test",
			"/foo", // matches :slug
			"/test/alpha",
			"/posts",
			"/posts/123/comments",
			"/posts/123/comments/456",
			"/api/users",
			"/api/users/42",
			"/static/js/app.js",
			"/assets/images/logo.png",
			"/files/path/to/file.txt",
		];

		// run many iterations to exercise the router
		for (let i = 0; i < 1000; i++) {
			for (const p of paths) {
				// call the app handler; support sync/async handlers by awaiting the result
				await app.fetch("http://localhost:5173" + p);
			}
		}
	}).gc("inner");
});

console.log("running benchmarks...\n");

await run();

console.log();
