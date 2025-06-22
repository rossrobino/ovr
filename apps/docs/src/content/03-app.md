---
title: App
description: Creating an application with ovr.
---

To create a web server with ovr, initialize a new `App` instance:

```ts
import { App } from "ovr";

const app = new App();
```

## Configuration

The following values can be customized after creating the `App`. You can also configure most of these per route within middleware by modifying the value on the `Context`.

### Trailing Slash

ovr handles [trailing slash](https://bjornlu.com/blog/trailing-slash-for-frameworks) redirects automatically, you can customize the redirect preference.

```tsk
app.trailingSlash = "never";
```

### Not Found

Customize the not found response handler.

```ts
app.notFound = (c) => c.html("Not found", 404);
```

### Error Handler

Add an error handler, by default errors are thrown.

```ts
app.error = (c, error) => {
	console.error(error);

	c.html("An error occurred", 500);
};
```

### Base HTML

Change the base HTML to inject elements into, this is the default.

```ts
app.base =
	'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';
```

## Overview

The `App` API is inspired by and works similar to frameworks such as [Hono](https://hono.dev/) and [Express](https://expressjs.com/).

### Response

At the most basic level, you can create a route and return a `Response` from the middleware to handle a request.

```ts
app.get("/", () => new Response("Hello world"));
```

You can also return a `ReadableStream` to use as the `Response.body`.

### JSX

Returning JSX or other non `null` or `undefined` values from middleware will generate an HTML streamed response.

```tsx
app.get("/", () => <h1>Hello world</h1>);
```

The element will be injected into the `<body>` element of the [`base`](/03-app#base-html) HTML.

## HTTP methods

`app.get` and `app.post` create handlers for the HTTP methods respectively. You can add other or custom methods with `app.on`.

```ts
// Other or custom methods
app.on("METHOD", "/pattern", () => {
	// ...
});
```

## Multiple patterns

Add the same middleware to multiple patterns.

```ts
app.get(["/multi/:param", "/pattern/:another"], (c) => {
	c.param; // { param: string } | { another: string }
});
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
	(c) => {
		console.log("2");
	},
);
```

The same [`Context`](/04-context) is passed into each middleware. After all the middleware have been run, the `Context` will `build` and return the final `Response`.

### Global Middleware

Add global middleware that runs in front of every request with `app.use`.

```ts
app.use(async (c, next) => {
	// ...

	await next();

	// ...
});
```

## Fetch

Use the `fetch` method to create a `Response`, this is the `Request` handler for your application.

```ts
const response = await app.fetch(new Request("https://example.com/"));
```
