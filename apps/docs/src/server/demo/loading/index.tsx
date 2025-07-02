import * as loadingContent from "@/server/demo/loading/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get, type JSX } from "ovr";

const Slow = async () => {
	await new Promise((res) => setTimeout(res, 2000));

	return (
		<div class="bg-foreground flex h-[175px] max-w-xs items-center justify-center rounded-md p-4">
			<h2 class="text-background m-0">slow</h2>
		</div>
	);
};

const Loading = (props: {
	children?: JSX.Element;
	fallback?: JSX.Element;
	after?: JSX.Element;
}) => (
	<>
		{props.fallback && (
			<div class="contents has-[+*>.loading-children:not(:empty)]:hidden">
				{props.fallback}
			</div>
		)}

		<div class="flex flex-col-reverse">
			{props.after && <div>{props.after}</div>}
			<div class="loading-children contents">{props.children}</div>
		</div>
	</>
);

const Skeleton = () => (
	<div class="bg-muted-foreground h-[175px] max-w-xs animate-pulse rounded-md"></div>
);

export const loading = new Get("/demo/loading", (c) => {
	c.head(<Head {...loadingContent.frontmatter} />);

	return (
		<>
			<h1>{loadingContent.frontmatter.title}</h1>

			{new Chunk(loadingContent.html, true)}

			<hr />

			<Loading
				fallback={<Skeleton />}
				after={
					<p class="mt-8">Streamed first, but displayed visually after.</p>
				}
			>
				<Slow />
			</Loading>
		</>
	);
});
