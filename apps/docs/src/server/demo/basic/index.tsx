import * as basicContent from "@/server/demo/basic/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const page = new Get("/demo/basic", (c) => {
	c.head(<Head {...basicContent.frontmatter} />);

	return (
		<>
			<h1>{basicContent.frontmatter.title}</h1>

			{new Chunk(basicContent.html, true)}
		</>
	);
});
