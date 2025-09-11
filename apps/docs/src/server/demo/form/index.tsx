import * as formContent from "@/server/demo/form/index.md";
import { Head } from "@/ui/head";
import { Chunk, Get, Post } from "ovr";
import * as z from "zod";

export const form = new Get("/demo/form", (c) => {
	c.head(<Head {...formContent.frontmatter} />);

	return (
		<>
			<h1>{formContent.frontmatter.title}</h1>

			{Chunk.safe(formContent.html)}

			<hr />

			<post.Form class="bg-muted border-secondary grid max-w-sm gap-4 rounded-md border p-4">
				<div>
					<label for="name">Name</label>
					<input type="text" name="name" id="name" />
				</div>

				<button>Submit</button>
			</post.Form>
		</>
	);
});

export const post = new Post(async (c) => {
	const data = await c.req.formData();
	const name = z.string().parse(data.get("name"));
	name; // text input string

	return c.redirect("/", 303);
});
