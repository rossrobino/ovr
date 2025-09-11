import * as parallelContent from "@/server/demo/parallel/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const parallel = new Get("/demo/parallel", (c) => {
	const Delay = async ({ ms }: { ms: number }) => {
		await new Promise((res) => setTimeout(res, ms));
		return <div class="bg-muted rounded-md p-2">{ms}ms</div>;
	};

	const Delays = () => {
		const delays = Array.from({ length: 6 }, (_, i) => i * 100);
		return delays.map((ms) => <Delay ms={ms} />);
	};

	c.head(<Head {...parallelContent.frontmatter} />);

	return (
		<>
			<h1>{parallelContent.frontmatter.title}</h1>

			{Chunk.safe(parallelContent.html)}

			<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
				<Delays />
			</div>

			<parallel.Anchor class="button ghost my-2 gap-3">
				<span class="icon-[lucide--rotate-cw]"></span> Refresh
			</parallel.Anchor>
		</>
	);
});
