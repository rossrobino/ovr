---
title: App
description: Creating an application with ovr.
---

To create a web server with ovr, initialize a new `App` instance:

```ts
import { App } from "ovr";

const app = new App();
```

The `App` API is inspired by and works similar to frameworks such as [Express](http://expressjs.com), [Koa](https://koajs.com), and [Hono](https://hono.dev/).

## Configuration

The following values can be configured when creating the `App`.

### Trailing Slash

ovr handles [trailing slash](https://bjornlu.com/blog/trailing-slash-for-frameworks) redirects automatically, you can customize the redirect preference.

```ts
new App({ trailingSlash: "always" });
```

### CSRF

ovr comes with basic [cross-site request forgery](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF) protection.

```ts
new App({ csrf: false }); // disables the built-in protection
```

## Response

At the most basic level, you can return a `Response` or `ReadableStream` from a `Middleware` function to handle a request.

```ts
app.use(() => new Response("Hello world"));
```

## HTML

Returning anything else (for example JSX) from middleware will generate an HTML streamed response.

```tsx
app.use(() => <h1>Hello world</h1>);
```

## Middleware

When multiple middleware functions are added to a route, the first middleware will be called, and the `next` middleware can be dispatched within the first by using `await next()`. Middleware is based on [koa-compose](https://github.com/koajs/compose).

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
