import * as basicContent from "@/server/demo/basic/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get, Post } from "ovr";

export const page = new Get("/demo/basic", (c) => {
	c.head(<Head {...basicContent.frontmatter} />);

	return (
		<>
			<h1>{basicContent.frontmatter.title}</h1>

			{new Chunk(basicContent.html, true)}

			<hr />

			<post.Form params={{ id: "hello" }}>
				<button>Submit</button>
			</post.Form>
		</>
	);
});

export const post = new Post("/post/:id", (c) => {
	console.log(c.params.id);
	console.log("posted");
	c.redirect("/", 303);
});
