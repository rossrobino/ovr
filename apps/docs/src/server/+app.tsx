import { content } from "@/content";
import * as demo from "@/server/demo";
import * as esc from "@/server/escape";
import { Layout } from "@/server/layout";
import { html } from "client:page";
import { App, Chunk, csrf } from "ovr";

const app = new App();

app.get(["/", "/:slug"], (c) => {
	const result =
		content[`/content/${"slug" in c.params ? c.params.slug : "index"}.md`];

	if (!result?.html) return;

	c.head(
		<>
			<title>{result.frontmatter.title}</title>
			<meta name="description" content={result.frontmatter.description} />
		</>,
	);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>
			{new Chunk(result.html, true)}
		</>
	);
});

app.base = html;
app.prerender = ["/"];

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

app.add(demo);

if (import.meta.env.DEV) {
	app.add(esc);
}

export default app;
