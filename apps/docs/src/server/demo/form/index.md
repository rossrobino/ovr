---
title: Form
description: Create a page and POST request handler with ovr.
---

This is a page and post route created with ovr's [`Get` and `Post` helpers](/04-helpers). The generated `<post.Form>` can be used directly within the `Get` handler.

```tsx
import { Get, Post } from "ovr";
import * as z from "zod";

export const page = new Get("/demo/form", (c) => {
	c.head(<title>Form</title>);

	return (
		<post.Form>
			<div>
				<label for="name">Name</label>
				<input type="text" name="name" id="name" />
			</div>

			<button>Submit</button>
		</post.Form>
	);
});

export const post = new Post(async (c) => {
	const data = await c.req.formData();
	const name = z.string().parse(data.get("name"));
	name; // text input string

	return c.redirect("/", 303);
});
```
