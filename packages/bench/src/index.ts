import { bench, run, summary } from "mitata";
import * as ovr from "ovr";

async function Async() {
	return ovr.jsx("p", { children: "Async" });
}

function* Component() {
	for (let r = 0; r < 500; r++) {
		yield ovr.jsx("div", {
			children: [r, ovr.jsx(Async, { class: "text-sm" })],
		});
	}
}

summary(() => {
	bench("generate 500", async () => {
		const gen = ovr.render(ovr.jsx(Component, {}));
		for await (const _r of gen);
	}).gc("inner");
});

const app = new ovr.App();

app.use(
	new ovr.Get("/", () => "home"),
	new ovr.Get("/test", () => "test"),
	new ovr.Get("/:slug", (c) => c.params.slug),
	new ovr.Get("/test/:slug", (c) => c.params.slug),
	new ovr.Get("/posts", (c) => c.text("posts")),
	new ovr.Get(
		"/posts/:postId/comments",
		(c) => `comments for ${c.params.postId}`,
	),
	new ovr.Get(
		"/posts/:postId/comments/:commentId",
		(c) => `comment ${c.params.commentId} on post ${c.params.postId}`,
	),
	new ovr.Get("/api/users", () => "users index"),
	new ovr.Get("/api/users/:id", (c) => `user ${c.params.id}`),
	new ovr.Get("/static/*", (c) => `static ${c.params["*"] ?? ""}`),
	new ovr.Get(
		"/assets/:type/:name",
		(c) => `${c.params.type}/${c.params.name}`,
	),
	new ovr.Get("/files/:path", (c) => `file ${c.params.path}`),
	new ovr.Post("/api/users", async (c) => {
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
