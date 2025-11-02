import type { FrontmatterSchema } from "@/lib/md";
import * as homeResult from "@/server/home/index.md";
import { Head } from "@/ui/head";
import type { Result } from "@robino/md";
import { clsx } from "clsx";
import { Chunk, Get } from "ovr";

export const content = import.meta.glob<Result<typeof FrontmatterSchema>>(
	`@/server/docs/*.md`,
	{ eager: true },
);

const demos = import.meta.glob<Result<typeof FrontmatterSchema>>(
	`@/server/demo/*/index.md`,
	{ eager: true },
);

export const getSlugs = () => {
	return Object.keys(content)
		.map((path) => {
			let slug = path.split("/").at(3)?.split(".").at(0);
			return slug;
		})
		.filter(Boolean);
};

export const getContent = (slug: string) => content[`/server/docs/${slug}.md`];

const getMd = (result: Result<typeof FrontmatterSchema>) => {
	return `# ${result.frontmatter.title}\n\n${
		result.frontmatter.description
	}${result.article}`;
};

export const llms = new Get("/llms.txt", (c) => {
	c.text(
		[homeResult, ...Object.values(content), ...Object.values(demos)]
			.map((result) => getMd(result))
			.join("\n"),
	);
});

export const page = new Get("/:slug", (c) => {
	let md = false;

	if (c.params.slug.endsWith(".md")) {
		md = true;
		c.params.slug = c.params.slug.slice(0, -3);
	}

	const result = getContent(c.params.slug);

	if (!result) return;

	if (md) {
		return c.res(getMd(result), {
			headers: { "Content-Type": "text/markdown; charset=UTF-8" },
		});
	}

	c.head.push(<Head {...result.frontmatter} />);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>

			{Chunk.safe(result.html)}

			<hr />

			{() => {
				const num = parseInt(c.params.slug);
				const previous = getSlugs().find((slug) => {
					if (!slug) return false;
					const n = parseInt(slug);
					return n === num - 1;
				});
				const next = getSlugs().find((slug) => {
					if (!slug) return false;
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
