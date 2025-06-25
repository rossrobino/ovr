---
title: Helpers
description: ovr route helpers.
---

ovr provides helpers to encapsulate a route, allowing you to easily create a route in a separate module from `App`.

## Get

`Get` creates a GET route and corresponding `Anchor`, `Button`, and `Form` components for it. This ensures if you change the route's pattern, you don't need to update all of the links to it throughout your application.

```tsx
import { Get } from "ovr";

const get = new Get("/", () => {
	return <p>hello world</p>;
});

// <a> tag with preset `href="/"` attribute
<get.Anchor>Home</get.Anchor>;

// <button> component with preset `formaction` and `formmethod` attributes
<get.Button>Submit</get.Button>

// <form> tag with preset `action="/"` attribute
<get.Form>...</get.Form>;
```

## Post

There is also an `Post` helper that will create a POST handler and corresponding `Form` and `Button` elements.

```tsx
import { Post } from "ovr";

const post = new Post((c) => {
	const data = await c.req.formData();

	// ...

	c.redirect("/", 303);
})

// <form> with preset `method="POST"` and `action` attributes
<post.Form>...</post.Form>;

// <button> component with preset `formaction` and `formmethod` attributes
<post.Button>Submit</post.Button>
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

## Properties

In addition to the components helpers have a few other useful properties.

```tsx
const get = new Get("/hello/:name", (c) => <h1>Hello {c.params.name}</h1>);
```

### Middleware

All `Middleware` added to the route.

```ts
get.middleware; // Middleware[]
```

### Params

`Params` is a type helper to get the specific params of the route based on the pattern.

```ts
typeof get.Params; // { name: string }
```

### Pattern

The route pattern.

```ts
get.pattern; // "/hello/:name"
```

### Pathname

The `pathname` method inserts params into the pattern. It provides type safety to ensure you always pass the correct params (or no params) to create the pathname.

```ts
get.pathname({ name: "world" }); // `/hello/${string}`
get.pathname({ name: "world" } as const); // "/hello/world"
```

Using incorrect params results in an error:

```ts
get.pathname({ id: "world" });
// Error: 'id' does not exist in type '{ name: string; }'
```

You can even create a list of exact pathnames for given params.

```ts
const params = [
	{ name: "world" },
	{ name: "ross" },
] as const satisfies (typeof get.Params)[];

const pathnames = params.map((p) => get.pathname(p));

// ("/hello/world" | "/hello/ross")[]
```
