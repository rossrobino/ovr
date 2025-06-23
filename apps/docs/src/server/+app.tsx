import { content, getSlugs } from "@/content";
import * as demo from "@/server/demo";
import { Layout } from "@/server/layout";
import { Head } from "@/ui/head";
import { html } from "client:page";
import { App, Chunk, Get, csrf } from "ovr";

const app = new App();

app.base = html;

app.prerender = getSlugs().map((slug) => "/" + slug);

app.use(
	(c, next) => {
		c.layout(Layout);
		return next();
	},
	csrf({
		origin: import.meta.env.DEV
			? "http://localhost:5173"
			: "https://ovr.robino.dev",
	}),
);

const home = new Get("/", (c) => {
	const result = content["/content/index.md"];
	if (!result) return;

	c.head(<Head {...result.frontmatter} />);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>
			{new Chunk(result.html, true)}
		</>
	);
});

const docs = new Get("/:slug", (c) => {
	if (c.params.slug === "index") {
		return c.redirect("/", 308);
	}

	const result = content[`/content/${c.params.slug}.md`];

	if (!result) return;

	c.head(<Head {...result.frontmatter} />);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>
			{new Chunk(result.html, true)}
		</>
	);
});

app.add(home, docs, demo);

export default app;
