import * as memoryContent from "@/server/demo/content/memory.md";
import * as parallelContent from "@/server/demo/content/parallel.md";
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
			{new Chunk(parallelContent.html, true)}

			<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
				<Delays />
			</div>

			<parallel.Anchor class="button ghost my-2 gap-3">
				<span class="icon-[lucide--rotate-cw]"></span> Refresh
			</parallel.Anchor>
		</>
	);
});

export const memory = new Get("/demo/memory", (c) => {
	c.head(<Head {...memoryContent.frontmatter} />);

	function* Numbers() {
		let i = 0;
		while (i < 10_000)
			yield <div class="bg-muted rounded p-2 text-center">{i++}</div>;
	}

	// function Numbers() {
	// 	const nums = Array.from({ length: 10_000 }, (_, i) => i);
	// 	return nums.map((item) => <li>{item}</li>);
	// }

	return (
		<>
			{new Chunk(memoryContent.html, true)}

			<div class="grid grid-cols-3 gap-1 sm:grid-cols-6">
				<Numbers />
			</div>
		</>
	);
});
