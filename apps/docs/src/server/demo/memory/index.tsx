import * as memoryContent from "@/server/demo/memory/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const memory = new Get("/demo/memory", async (c) => {
	c.head(<Head {...memoryContent.frontmatter} />);

	function* Numbers() {
		let i = 0;
		// const time = performance.now();
		while (i < 4_998) {
			i++;
			yield <div class="bg-foreground rounded-sm p-0.5" />;
		}
		// console.log(performance.now() - time);
	}

	// const time = performance.now();
	// const str = await toString(Numbers);
	// console.log(performance.now() - time);

	// function Numbers() {
	// 	const nums = Array.from({ length: 10_000 }, (_, i) => i);
	// 	return nums.map((item) => <li>{item}</li>);
	// }

	return (
		<>
			{() => c.head("hello")}
			<h1>{memoryContent.frontmatter.title}</h1>

			{new Chunk(memoryContent.html, true)}

			<div
				class="flex flex-wrap gap-px"
				aria-label="This is div element that displays five thousand div elements that are streamed in. When the page is reloaded each div is streamed in order."
			>
				<Numbers />
			</div>
		</>
	);
});
