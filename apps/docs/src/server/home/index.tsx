import * as result from "@/server/home/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const page = new Get("/", (c) => {
	c.head.push(<Head {...result.frontmatter} />);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>

			<p class="text-lg">
				A lightweight server framework <strong>built for streaming</strong> with
				asynchronous generator JSX.
			</p>

			<hr />

			<div class="mb-5 grid gap-4 sm:grid-cols-2">
				<Features />
			</div>

			<a
				href="/demo/memory"
				data-no-prefetch
				class="bg-foreground block rounded-md p-5 no-underline transition-shadow hover:shadow-sm"
			>
				<h2 class="text-background mt-0 mb-1 text-2xl">Demo</h2>
				<p class="text-muted mb-0 font-light">
					Check out the demos to see ovr in action.
				</p>
			</a>

			<hr />

			{Chunk.safe(result.html)}

			<hr />

			<div class="mb-12 flex justify-center">
				<a href="/01-get-started" class="button h-12 px-5 text-lg">
					Get Started
				</a>
			</div>
		</>
	);
});

function* Features() {
	const features = [
		{
			title: "Async Generator JSX",
			href: "/#introduction",
			content:
				"Stream HTML with familiar JSX components, no client-side JS required.",
		},
		{
			title: "Performance First",
			href: "/demo/parallel",
			noPrefetch: true,
			content:
				"Evaluate components in parallel and stream them as they are generated.",
		},
		{
			title: "Lightweight",
			href: "https://npmgraph.js.org/?q=ovr",
			content: "Heavy on features, zero dependencies.",
		},
		{
			title: "Type Safe",
			href: "/04-helpers#pathname",
			content: "Type safe path parameters, components, and more.",
		},
		{
			title: "Blazing Fast Routing",
			href: "/06-routing",
			content: "Code based routing that scales.",
		},
		{
			title: "Web Standards",
			href: "/01-get-started#compatibility",
			content: "Built on the Fetch API, ovr runs everywhere.",
		},
	];

	for (const feature of features) {
		yield (
			<a
				href={feature.href}
				class="bg-muted/25 hover:bg-background border-secondary/50 hover:border-secondary rounded-md border p-4 no-underline transition-colors hover:shadow-xs"
				data-no-prefetch={feature.noPrefetch}
			>
				<h2 class="my-0 text-base">{feature.title}</h2>
				<p class="text-muted-foreground mt-1 mb-0 text-sm font-light">
					{feature.content}
				</p>
			</a>
		);
	}
}
