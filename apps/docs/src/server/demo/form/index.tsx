import * as formContent from "@/server/demo/form/index.md";
import { createLayout } from "@/ui/layout";
import { Meta } from "@/ui/meta";
import * as ovr from "ovr";
import * as z from "zod";

export const form = ovr.Route.get("/demo/form", (c) => {
	const Layout = createLayout(c);

	return (
		<Layout head={<Meta {...formContent.frontmatter} />}>
			<h1>{formContent.frontmatter.title}</h1>

			{ovr.Chunk.safe(formContent.html)}

			<hr />

			<post.Form class="bg-muted border-secondary grid max-w-sm gap-4 rounded-md border p-4">
				<div>
					<label for="name">Name</label>
					<input type="text" name="name" id="name" />
				</div>

				<button>Submit</button>
			</post.Form>
		</Layout>
	);
});

export const post = ovr.Route.post(async (c) => {
	const data = await c.req.formData();
	const name = z.string().parse(data.get("name"));
	name; // text input string

	c.redirect("/", 303);
});
