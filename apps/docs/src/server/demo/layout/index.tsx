import * as layoutContent from "@/server/demo/layout/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const layout = new Get("/demo/layout", (c) => {
	c.head(<Head {...layoutContent.frontmatter} />);

	return (
		<>
			<h1>{layoutContent.frontmatter.title}</h1>

			{Chunk.safe(layoutContent.html)}
		</>
	);
});
