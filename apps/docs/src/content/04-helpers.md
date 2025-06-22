---
title: Helpers
description: ovr route helpers.
---

ovr provides helpers to encapsulate a route, allowing you to easily create a route in a separate module from `App`.

## Get

`Get` creates a GET route and a corresponding `Anchor` component for it. This ensures if you change the route's pattern, you don't need to update all of the links to it throughout your application.

```tsx
import { Get } from "ovr";

const get = new Get("/", () => {
	return <p>hello world</p>;
});

<get.Anchor>Home</get.Anchor>; // <a> tag with preset `href="/"` attribute
```

## Post

There is also an `Post` helper that will create a POST handler and a corresponding `Form` element.

```tsx
import { Post } from "ovr";

const post = new Post((c) => {
	const data = await c.req.formData();

	// ...

	c.redirect("/", 303);
})

<post.Form>...</post.Form>; // <form> with preset `method` and `action` attributes
```

For `Post`, ovr will automatically create a unique pattern for the route based on a hash of the middleware provided.

You can also set the pattern manually:

```tsx
const post = new Post("/custom/pattern", (c) => {
	// ...
});
```

## Add

Use the `add` method to register a `Get` or `Post` to your app.

```tsx
app.add(get); // single
app.add(get, post); // multiple
app.add({ get, post }); // object
app.add([get, post]); // array
// any combination of these also works
```

This makes it easy to create a module of routes,

```tsx
// home.tsx
import { Get, Post } from "ovr";

export const get = new Get("/", (c) => {
	// ...
});

export const post = new Post((c) => {
	// ...
});
```

and then add them all at once:

```tsx
// app.tsx
import * as home from "./home";

app.add(home); // adds all exports
```
