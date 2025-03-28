import { Node, Route } from "./index.js";
import { expect, test } from "vitest";

const trie = new Node<string>()
	.add(new Route("/", "/"))
	.add(new Route("/static/static", "/static/static"))
	.add(new Route("/static/:param", "/static/:param"))
	.add(new Route("/static/:param/:another", "/static/:param/:another"))
	.add(
		new Route(
			"/static/:param/:another/static",
			"/static/:param/:another/static",
		),
	)
	.add(
		new Route(
			"/static/:param/:another/static/static",
			"/static/:param/:another/static/static",
		),
	)
	.add(
		new Route(
			"/static/:param/:another/static/different",
			"/static/:param/:another/static/different",
		),
	)
	.add(new Route("/static/fork", "/static/fork"))
	.add(new Route("/static/fork/:param", "/static/fork/:param"))
	.add(new Route("/wild/*", "/wild/*"));

test("/", () => {
	const result = trie.find("/");
	expect(result?.route.store).toBe("/");
	expect(result?.params).toStrictEqual({});
});

test("/static/static", () => {
	const result = trie.find("/static/static");
	expect(result?.route.store).toBe("/static/static");
	expect(result?.params).toStrictEqual({});
});

test("/static/:param", () => {
	const result = trie.find("/static/param");
	expect(result?.route.store).toBe("/static/:param");
	expect(result?.params).toStrictEqual({ param: "param" });
});

test("/static/:param/:another", () => {
	const result = trie.find("/static/param/another");
	expect(result?.route.store).toBe("/static/:param/:another");
	expect(result?.params).toStrictEqual({ param: "param", another: "another" });
});

test("/static/:param/:another/static", () => {
	const result = trie.find("/static/param/another/static");
	expect(result?.route.store).toBe("/static/:param/:another/static");
	expect(result?.params).toStrictEqual({ param: "param", another: "another" });
});

test("/static/:param/:another/static/static", () => {
	const result = trie.find("/static/param/another/static/static");
	expect(result?.route.store).toBe("/static/:param/:another/static/static");
	expect(result?.params).toStrictEqual({ param: "param", another: "another" });
});

test("/static/:param/:another/static/different", () => {
	const result = trie.find("/static/param/another/static/different");
	expect(result?.route.store).toBe("/static/:param/:another/static/different");
	expect(result?.params).toStrictEqual({ param: "param", another: "another" });
});

test("/static/fork", () => {
	const result = trie.find("/static/fork");
	expect(result?.route.store).toBe("/static/fork");
	expect(result?.params).toStrictEqual({});
});

test("/static/fork/:param", () => {
	const result = trie.find("/static/fork/param");
	expect(result?.route.store).toBe("/static/fork/:param");
	expect(result?.params).toStrictEqual({ param: "param" });
});

test("/wild/*", () => {
	const result = trie.find("/wild/whatever");
	expect(result?.route.store).toBe("/wild/*");
	expect(result?.params).toStrictEqual({ "*": "whatever" });
});

test("/nope", () => {
	const result = trie.find("/nope");
	expect(result).toBe(null);
});

test("/static//static", () => {
	const result = trie.find("/static//static");
	expect(result).toBe(null);
});

test("Empty path", () => {
	const result = trie.find("");
	expect(result).toBe(null);
});

test("/static/ (trailing slash)", () => {
	const result = trie.find("/static/");
	expect(result).toBe(null);
});

test("/*", () => {
	trie.add(new Route("/*", "/*"));
	const result = trie.find("/whatever");
	expect(result?.route.store).toBe("/*");
	expect(result?.params).toStrictEqual({ "*": "whatever" });
});
