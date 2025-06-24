import { content, getSlugs } from "@/content";
import * as demo from "@/server/demo";
import { Layout } from "@/server/layout";
import { Head } from "@/ui/head";
import { html } from "client:page";
import clsx from "clsx";
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

			<hr />

			{() => {
				const num = parseInt(c.params.slug);
				const previous = getSlugs().find((slug) => {
					const n = parseInt(slug);
					return n === num - 1;
				});
				const next = getSlugs().find((slug) => {
					const n = parseInt(slug);
					return n === num + 1;
				});

				const Link = (props: {
					slug: string | undefined;
					class?: string;
					next?: boolean;
				}) => {
					if (!props.slug) return <div></div>;

					return (
						<a
							class={clsx(
								"border-secondary flex flex-col gap-2 rounded-md border p-4 capitalize no-underline",
								props.class,
							)}
							href={`/${props.slug}`}
						>
							<span class="text-muted-foreground text-xs uppercase">
								{props.next ? "Next page" : "Previous page"}
							</span>
							<span class="underline">
								{props.slug.split("-").slice(1).join(" ")}
							</span>
						</a>
					);
				};

				return (
					<div class="grid grid-cols-2 gap-4">
						<Link slug={previous} />
						<Link slug={next} class="items-end" next />
					</div>
				);
			}}
		</>
	);
});

app.add(home, docs, demo);

export default app;
