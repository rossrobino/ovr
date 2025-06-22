---
title: App
description: Creating an application with ovr.
---

To create a web server with ovr, initialize a new `App` instance:

```tsx
import { App } from "ovr";

const app = new App();
```

## Configuration

The following values can be customized after creating the `App`.

```tsx
// redirect trailing slash preference - default is "always"
app.trailingSlash = "always";

// customize the not found response
app.notFound = (c) => c.html("Not found", 404);

// add an error handler
app.error = (c, error) => c.html(error.message, { status: 500 });

// base HTML to inject elements into, this is the default
app.base =
	'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';
```

## Overview

The `App` API is inspired by and works similar to frameworks such as [Hono](https://hono.dev/) and [Express](https://expressjs.com/). Below are some examples of how to create basic routes with the corresponding functions for each HTTP method.

```tsx
// Return JSX as a streamed HTML response
app.get("/", () => <h1>Hello</h1>);

// API route
app.get("/text", (c) => c.text("Hello world"));

// Params
app.post("/api/:id", (c) => {
	// matches "/api/123"
	c.params; // { id: "123" }
});

// Wildcard - add an asterisk `*` to match all remaining segments in the route
app.get("/files/*", (c) => {
	c.params["*"]; // matched wildcard path (e.g., "images/logo.png")
});

// Multiple patterns
app.get(["/multi/:param", "/pattern/:another"], (c) => {
	c.param; // { param: string } | { another: string }
});

// Other or custom methods
app.on("METHOD", "/pattern", (c) => {
	// ...
});

// Global middleware
app.use(async (c, next) => {
	// ...
});
```

## Return values

Here are the various actions that occur based on the return type of the handler.

| Return Value                             | Action                     |
| ---------------------------------------- | -------------------------- |
| `Response`                               | Passed into `context.res`  |
| `ReadableStream`                         | Assigned to `context.body` |
| Other truthy values (JSX, strings, etc.) | Passed into `context.page` |
| Falsy values                             | None                       |

## Context

`Context` contains context for the current request and helpers to build a `Response`.

```tsx
app.get("/api/:id", (c) => {
	// Request info
	c.req; // original Request
	c.url; // parsed URL
	c.params; // type-safe route parameters ({ id: "123" })
	c.route; // matched Route (contains pattern, store)

	// Response building methods
	c.html(body, status); // Set HTML response
	c.text(body, status); // Set plain text response
	c.json(data, status); // Set JSON response
	c.redirect(location, status); // Set redirect response
	c.res(body, init); // Generic response (like `new Response()`)

	// JSX page building methods (Leverages Streaming JSX)
	c.head(<meta name="description" content="..." />); // add elements to <head>
	c.layout(Layout); // wrap page content with layout components
	c.page(<UserProfilePage userId={c.params.id} />); // stream JSX page (same as returning)

	// other utilities
	c.memo(fn); // memoize a function to dedupe async operations and cache the results
	c.etag("content-to-hash"); // generate and check ETag for caching

	// internal
	c.build(); // builds the final Response object
});
```

Context can be acquired from anywhere within the scope of a request handler with the `Context.get` method. `get` uses `AsyncLocalStorage` under the hood. This prevents you from having to prop drill the context to each component from the handler.

```tsx
import { Context } from "ovr";

function Component() {
	const c = Context.get(); // current request context
}
```

## Middleware

When multiple middleware handlers are added to a route, the first middleware will be called, and the `next` middleware can be dispatched within the first by using `await next()`. Middleware is based on [koa-compose](https://github.com/koajs/compose).

```ts
app.get(
	"/multi",
	async (c, next) => {
		console.log("1");

		await next(); // dispatches the next middleware below

		console.log("3");
	},
	() => {
		console.log("2");
	},
);
```

The same `Context` is passed into each middleware. After all the middleware have been run, the `Context` will `build` and return the final `Response`.

## Get

The `Get` helper encapsulates a GET route and creates an `Anchor` component for it. This ensures if you change the route's pattern, you don't need to update all of the links to it throughout your application.

```tsx
import { Get } from "ovr";

const get = new Get("/", (c) => {
	return <p>hello world</p>;
});

<get.Anchor>Home</get.Anchor>; // <a> tag with preset `href` attribute
```

## Post

There is also an `Post` helper that will create a POST handler and a corresponding `Form` element that can be used within other components.

```tsx
import { Post } from "ovr";

const post = new Post((c) => {
	const data = await c.req.formData();

	// ...

	c.redirect("/", 303);
})

<post.Form>...</post.Form>; // <form> with preset `method` and `action` attributes
```

ovr will automatically create a unique pattern for the route based on a hash of the middleware provided.

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

This makes it easy to create a module of routes, and add them all at once.

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

```tsx
// app.tsx
import * as home from "./home";

app.add(home); // adds all exports
```

## Fetch

Use the `fetch` method to create a `Response`, this is the `Request` handler for your application.

```ts
const response = await app.fetch(new Request("https://example.com/"));
```

## Memoization

If you need to display a component in multiple locations, you need to ensure you aren't fetching the same data multiple times. ovr provides built in memoization on the request context you can utilize on any function to memoize it for the request.

```tsx
import { Context } from "ovr";
import { db } from "@/lib/db";

function getData(id: number) {
	const c = Context.get();
	return c.memo(db.query)(id);
}

async function Data(props: { id: number }) {
	const data = await getData(props.id);

	return <span>{data}<span>;
}
```

This will deduplicate multiple calls to the same function with the with the same arguments and cache the result.

### Create your own cache

The `Memo` class can also be utilized outside of the application context if you need to cache across requests. It's generally safer to cache per request using `Context.memo`---especially for user specific or sensitive information.

```ts
import { Memo } from "ovr";

const memo = new Memo();

const add = memo.use((a: number, b: number) => a + b);

add(1, 2); // runs
add(1, 2); // cached
add(2, 3); // runs again, saves the new result separately
```
