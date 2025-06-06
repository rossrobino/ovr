import { Context } from "./context.js";
import { App } from "./index.js";
import { describe, expect, test } from "vitest";

const app = new App();

app.trailingSlash = "always";

const get = (pathname: string) =>
	app.fetch(new Request("http://localhost:5173" + pathname));

test("context", () => {
	app
		.get(
			"/",
			async (c, next) => {
				c.req.headers.set("hello", "world");
				await next();
			},
			(c) => {
				expect(c.url).toBeInstanceOf(URL);
				expect(c.req).toBeInstanceOf(Request);
				expect(c.req.headers.get("hello")).toBe("world");

				c.text("hello world");
			},
		)
		.get("/api/:id/", (c) => {
			expect(c.params.id).toBeDefined();
			Context.get().json(c.params);
		})
		.get("/wild/*", (c) => {
			expect(c.params["*"]).toBeDefined();
			c.json(c.params);
		});

	app.get(["/multi/:param/", "/pattern/:another/"], (c) => {
		if ("param" in c.params) {
			expect(c.params.param).toBeDefined();
			c.text("multi");
		} else {
			expect(c.params.another).toBeDefined();
			c.text("pattern");
		}
	});

	app.post("/post/", async (c) => {
		const formData = await c.req.formData();
		c.json(formData.get("key"));
	});

	app.get("/error/", (c) => {
		c.error = (c, error) => {
			expect(error).toBeInstanceOf(Error);
			c.text((error as Error).message, 500);
		};

		throw new Error("An error occurred");
	});

	app.get("/page", (c) => {
		c.layout(function* ({ children }) {
			yield "Layout";

			yield children;

			yield "END LAYOUT";
		});

		c.head("<meta name='description' content='desc'>");

		c.layout(function ({ children }) {
			return `nested ${children} nested`;
		});

		c.page("page");
	});

	app.use(async (_, next) => {
		await next();
	});

	app.on(["POST", "GET"], "/multi-method", async (c) => {
		return c.text(c.req.method);
	});

	app.get("/memo", (c) => {
		let i = 0;

		const add = c.memo((a: number, b: number) => {
			i++;
			return a + b;
		});

		add(1, 1);
		add(1, 1);

		expect(i).toBe(1);
	});
});

test("GET /", async () => {
	const res = await get("/");
	const text = await res.text();

	expect(text).toBe("hello world");
});

test("GET /api/:id/", async () => {
	const res = await get("/api/123/");
	const json = await res.json();

	expect(json.id).toBe("123");
});

test("GET /wild/*", async () => {
	const res = await get("/wild/hello");
	const json = await res.json();

	expect(json["*"]).toBe("hello");
});

test("POST /post/", async () => {
	const body = new FormData();
	body.append("key", "value");

	const res = await app.fetch(
		new Request("http://localhost:5173/post/", { method: "post", body }),
	);

	const json = await res.json();

	expect(json).toBe("value");
});

test("GET /multi/param & /pattern/another", async () => {
	const multi = await get("/multi/param/");
	const mText = await multi.text();
	expect(mText).toBe("multi");

	const pat = await get("/pattern/another/");
	const pText = await pat.text();
	expect(pText).toBe("pattern");
});

test("GET /not-found/", async () => {
	const res = await get("/not-found/");
	const text = await res.text();

	expect(text).toBe("Not found");
	expect(res.status).toBe(404);
});

test("GET /error/ (custom)", async () => {
	const res = await get("/error/");
	expect(await res.text()).toBe("An error occurred");
});

describe("trailing slash", () => {
	test("always", async () => {
		const res = await get("/api/123");

		expect(res.status).toBe(308);
		expect(res.headers.get("location")).toBe("http://localhost:5173/api/123/");
	});

	test("never", async () => {
		const nev = new App();
		nev.get("/test", (c) => c.text("test"));

		const res = await nev.fetch(new Request("http://localhost:5173/test/"));

		expect(res.status).toBe(308);
		expect(res.headers.get("location")).toBe("http://localhost:5173/test");
	});

	test("ignore", async () => {
		const ignore = new App();
		ignore.trailingSlash = "ignore";

		ignore.get("/nope", (c) => c.text("nope"));
		ignore.get("/yup/", (c) => c.text("yup"));

		expect(
			(await ignore.fetch(new Request("http://localhost:5173/nope"))).status,
		).toBe(200);
		expect(
			(await ignore.fetch(new Request("http://localhost:5173/nope/"))).status,
		).toBe(404);

		expect(
			(await ignore.fetch(new Request("http://localhost:5173/yup"))).status,
		).toBe(404);
		expect(
			(await ignore.fetch(new Request("http://localhost:5173/yup/"))).status,
		).toBe(200);
	});
});

test("html", async () => {
	const res = await get("/page");
	const text = await res.text();
	expect(res.status).toBe(200);
	expect(text.startsWith("<")).toBe(true);
});

test("etag", async () => {
	const r = new App();
	r.get("/etag", (c) => {
		const text = "hello world";
		const matched = c.etag("hello");

		if (matched) return;

		c.text(text);
	});

	const res = await r.fetch(new Request("http://localhost:5173/etag"));
	expect(res.status).toBe(200);
	expect(await res.text()).toBe("hello world");

	const etag = await r.fetch(
		new Request("http://localhost:5173/etag", {
			headers: { "if-none-match": res.headers.get("etag")! },
		}),
	);
	expect(etag.status).toBe(304);
	expect(await etag.text()).toBe("");
});

test("multi-method", async () => {
	const res = await get("/multi-method");
	const text = await res.text();

	expect(text).toBe("GET");
});

test("memo", async () => {
	get("/memo");
});
