import { processor } from "@/lib/md";
import code from "@/server/demo/basic?raw";
import { Chunk, Get, Post } from "ovr";

export const page = new Get("/demo/basic", () => {
	const codeBlock = new Chunk(
		processor.render(`\`\`\`tsx\n${code}\`\`\``),
		true,
	);

	return (
		<div>
			<h1>Basic</h1>

			<p>
				Here is a basic page and post method created with ovr's <code>Get</code>{" "}
				and <code>Post</code> helpers.
			</p>

			<post.Form>
				<button>Submit</button>
			</post.Form>

			{codeBlock}
		</div>
	);
});

export const post = new Post((c) => {
	console.log("posted");
	c.redirect("/demo/basic", 303);
});
