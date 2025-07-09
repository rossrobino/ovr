import * as result from "@/server/home/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get } from "ovr";

export const page = new Get("/", (c) => {
	c.head(<Head {...result.frontmatter} />);

	return (
		<>
			<h1>{result.frontmatter.title}</h1>

			{new Chunk(result.html, true)}

			<div class="my-12 flex justify-center">
				<a href="/01-get-started" class="button h-12 px-5 text-lg">
					Get Started
				</a>
			</div>

			<hr />
		</>
	);
});
