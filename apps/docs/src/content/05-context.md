---
title: Context
description: Understanding the ovr request context.
---

`Context` contains context for the current request and helpers to build a `Response`.

## Request Information

Access information about the current request like the `url` or [`params`](/06-routing#parameters).

```ts
app.get("/api/:id", (c) => {
	c.req; // original Request
	c.url; // parsed URL
	c.params; // type-safe route parameters ({ id: "123" })
	c.route; // matched Route (contains pattern, store)
});
```

## Response Builders

The context also contains methods to build your final `Response`.

### Basic

Easily set the response to common content types.

```tsx
app.get("/api/:id", (c) => {
	c.html(body, status); // Set HTML response
	c.text(body, status); // Set plain text response
	c.json(data, status); // Set JSON response
	c.redirect(location, status); // Set redirect response
	c.res(body, init); // Generic response (like `new Response()`)
});
```

### Page Builders

There are also JSX page building methods which leverage streaming JSX.

```tsx
app.get("/api/:id", (c) => {
	c.head(<meta name="description" content="..." />); // inject elements into <head>
	c.layout(Layout); // wrap page content with layout components
	c.page(<UserProfilePage userId={c.params.id} />); // stream JSX page (same as returning JSX)
});
```

## Utilities

```tsx
app.get("/api/:id", (c) => {
	c.memo(fn); // memoize a function to dedupe async operations and cache the results
	c.etag("content-to-hash"); // generate and check ETag for caching

	// internal
	c.build(); // builds the final Response object
});
```

## Get

Context can be acquired from anywhere within the scope of a request handler with the `Context.get` method. `get` uses [`AsyncLocalStorage`](https://blog.robino.dev/posts/async-local-storage) under the hood. This prevents you from having to prop drill the context to each component from the handler.

```tsx
import { Context } from "ovr";

function Component() {
	const c = Context.get(); // current request context
}
```
