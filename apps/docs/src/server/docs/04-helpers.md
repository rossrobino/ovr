---
title: Helpers
description: ovr route helpers.
---

ovr provides helpers to encapsulate a route, allowing you to easily create a route in a separate module from `App`. Helpers are the best way to create pages, API endpoints, links, and forms in an ovr application.

## Get

`Get` creates a [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET) route and corresponding `Anchor`, `Button`, and `Form` components for it. This ensures if you change the route's pattern, you don't need to update all of the links to it throughout your application. Anytime you need to generate a link to a page use the `Anchor` component from the `Get` helper.

```tsx
import { Get } from "ovr";

const page = new Get("/", () => {
	return (
		<main>
			{/* <a href="/"> */}
			<page.Anchor>Home</page.Anchor>

			{/* <button formmethod="GET" formaction="/"> */}
			<page.Button>Submit</page.Button>

			{/* <form method="GET" action="/"> */}
			<page.Form>...</page.Form>
		</main>
	);
});
```

## Post

There is also a `Post` helper that will create a [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST) handler and corresponding `Form` and `Button` elements. Anytime you need to handle a form submission, use the generated `Form` component from the `Post` helper.

For `Post`, ovr will automatically generate a unique pathname for the route based on a hash of the middleware provided.

```tsx
import { Get, Post } from "ovr";

const login = new Post(async (c) => {
	const data = await c.req.formData();
	// ...
	c.redirect("/", 303);
});

const page = new Get("/", () => {
	return (
		<main>
			{/* <form method="POST" action="/_p/generated-hash"> */}
			<login.Form>...</login.Form>

			{/* <button formmethod="POST" formaction="/_p/generated-hash"> */}
			<login.Button>Submit</login.Button>
		</main>
	);
});
```

You can set the pattern manually if you need a stable pattern or if you are using parameters.

```tsx
const custom = new Post("/custom/:pattern", (c) => {
	// ...
});
```

## Props

If the route's pattern has `params`, they must be passed as a prop into the corresponding component to construct the URL.

You can also pass the [`search`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) props to each component. `search` will be passed into [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams) constructor, while `hash` will be appended with a `#` at the end.

```tsx
import { Get } from "ovr";

const page = new Get("/hello/:name", () => {
	return (
		// <form method="GET" action="/hello/world?search=param#hash">
		<page.Form
			params={{ name: "world" }}
			search={{ search: "param" }}
			hash="hash"
		>
			...
		</page.Form>
	);
});
```

## Add

Use the `add` method to register a helper to your app.

```tsx
app.add(page); // single
app.add(page, login); // multiple
app.add({ page, login }); // object
app.add([page, login]); // array
// any combination of these also works
```

This makes it easy to create a module of helpers,

```tsx
// home.tsx
import { Get, Post } from "ovr";

export const page = new Get("/", (c) => {
	// ...
});

export const login = new Post((c) => {
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

Given the following `Get` helper, a variety of other properties are available to use in addition to the components.

```tsx
const page = new Get("/hello/:name", (c) => <h1>Hello {c.params.name}</h1>);
```

### Middleware

All `Middleware` added to the route.

```ts
page.middleware; // Middleware[]
```

### Params

`Params` is a type helper to get the specific params of the route based on the pattern.

```ts
typeof page.Params; // { name: string }
```

### Pattern

The route pattern.

```ts
page.pattern; // "/hello/:name"
```

### Pathname

The `pathname` method inserts params into the pattern. It provides type safety to ensure you always pass the correct params (or no params) to create the pathname.

In this case, given the pattern `/hello/:name`, the `name` property must be passed in on the `params` object.

```ts
page.pathname({ name: "world" }); // `/hello/${string}`
page.pathname({ name: "world" } as const); // "/hello/world"
```

Using incorrect params results in a type error:

```ts
page.pathname({ id: "world" });
// Error: 'id' does not exist in type '{ name: string; }'
```

You can create a list of exact pathnames for given params.

```ts
const params = [
	{ name: "world" },
	{ name: "ross" },
] as const satisfies (typeof page.Params)[];

const pathnames = params.map((p) => page.pathname(p));

// ("/hello/world" | "/hello/ross")[]
```

### Relative URL

The `url` method creates a _relative_ URL (without the `origin`) for the route. This method is similar to `pathname`, but also provides the ability to also pass [`search`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) options to create the URL.

```ts
// /hello/world?search=param#hash
const relativeUrl = page.url({
	params: { name: "world" },
	search: { search: "param" },
	hash: "hash",
});

const absoluteUrl = new URL(relativeUrl, "https://example.com");
absoluteUrl.href; // https://example.com/hello/world?search=param#hash
```
