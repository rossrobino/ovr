---
title: App
description: Creating an application with ovr.
---

To create a web server with ovr, initialize a new `App` instance:

```ts
import { App } from "ovr";

const app = new App();
```

The `App` API is inspired by and works similar to frameworks such as [Hono](https://hono.dev/) and [Express](https://expressjs.com/).

## Configuration

The following values can be configured when creating the `App`.

### Trailing Slash

ovr handles [trailing slash](https://bjornlu.com/blog/trailing-slash-for-frameworks) redirects automatically, you can customize the redirect preference.

```ts
new App({ trailingSlash: "always" });
```

### CSRF

TODO

## Response

At the most basic level, you can create a route and return a `Response` from the middleware to handle a request.

```ts
app.get("/", () => new Response("Hello world"));
```

You can also return a `ReadableStream` to use as the `Response.body`.

## JSX

Returning JSX from middleware will generate an HTML streamed response.

```tsx
app.get("/", () => <h1>Hello world</h1>);
```

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
	c.params; // { param: string } | { another: string }
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
const response = await app.fetch("https://example.com");
```
