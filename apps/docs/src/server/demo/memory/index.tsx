import * as memoryContent from "@/server/demo/memory/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const memory = new Get("/demo/memory", async (c) => {
	c.head(<Head {...memoryContent.frontmatter} />);

	function* OverNineThousand() {
		const time = performance.now();

		for (let i = 0; i < 9_114; i++) {
			yield <div class="bg-foreground rounded-sm p-0.5" />;
		}

		console.log(performance.now() - time);
	}

	// const time = performance.now();
	// const str = await toString(OverNineThousand);
	// console.log(performance.now() - time);

	// function OverNineThousand() {
	// 	const nums = Array.from({ length: 9_114 }, (_, i) => i);
	// 	return nums.map((item) => <li>{item}</li>);
	// }

	return (
		<>
			<h1>{memoryContent.frontmatter.title}</h1>

			{Chunk.safe(memoryContent.html)}

			<div class="flex flex-wrap gap-px">
				<div class="sr-only">
					This is div element that displays five thousand div elements that are
					streamed in. When the page is reloaded each div is streamed in order.
				</div>
				<OverNineThousand />
			</div>
		</>
	);
});
