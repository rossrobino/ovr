---
title: Basic
description: Create a page and POST request handler with ovr.
---

Here is a basic page and post method created with ovr's `Get` and `Post` helpers.

```tsx
import { Get, Post } from "ovr";

export const page = new Get("/demo/basic", (c) => {
	c.head(<title>Basic</title>);

	return (
		<>
			<h1>Basic</h1>

			<post.Form>
				<button>Submit</button>
			</post.Form>
		</>
	);
});

export const post = new Post((c) => {
	console.log("posted");
	c.redirect("/", 303);
});
```
