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
			<p>Hello world!</p>

			{/* <a> tag with preset `href` attribute */}
			<page.Anchor>Home</page.Anchor>

			{/* <button> component with preset `formaction` and `formmethod` attributes */}
			<page.Button>Submit</page.Button>

			{/* <form> tag with preset `action` attribute */}
			<page.Form>...</page.Form>
		</main>
	);
});
```

## Post

There is also a `Post` helper that will create a [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST) handler and corresponding `Form` and `Button` elements. Anytime you need to handle a form submission, use the generated `Form` component from the `Post` helper.

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
			{/* <form> with preset `method` and `action` attributes */}
			<login.Form>...</login.Form>

			{/* <button> component with preset `formaction` and `formmethod` attributes */}
			<login.Button>Submit</login.Button>
		</main>
	);
});
```

For `Post`, ovr will automatically create a unique pattern for the route based on a hash of the middleware provided.

You can also set the pattern manually if you need a stable pattern or if you are using parameters.

```tsx
const custom = new Post("/custom/:pattern", (c) => {
	// ...
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

## Other properties

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

You can even create a list of exact pathnames for given params.

```ts
const params = [
	{ name: "world" },
	{ name: "ross" },
] as const satisfies (typeof page.Params)[];

const pathnames = params.map((p) => page.pathname(p));

// ("/hello/world" | "/hello/ross")[]
```
