---
title: Middleware
description: Understand how ovr handles each request.
---

## Global and route middleware

Use global middleware to add intermediate steps before and after route specific middleware has completed.

## Composition stack???

When multiple middleware functions added globally or to a route, the first middleware will be called, and the `next` middleware can be dispatched within the first by using `await next()`.

> Middleware execution is based on [koa-compose](https://github.com/koajs/compose).

```ts
app.use(
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

## Context

`Context` contains context for the current request and helpers to build a `Response`.

### Request

Access information about the current request such as the [`url`](https://developer.mozilla.org/en-US/docs/Web/API/URL) or [`params`](/06-routing#parameters).

```ts
Route.get("/api/:id", (c) => {
	c.req; // original `Request`
	c.url; // parsed web `URL`
	c.params; // type-safe route parameters { id: "123" }
	c.route; // matched `Route`
});
```

### Response

#### Prepare

`Context.res` is a `PreparedResponse` that stores the arguments that will be passed into `new Response()` after middleware has executed.

```ts
Route.get("/api/:id", (c) => {
	c.res.body; // BodyInit | null | undefined
	c.res.status; // number | undefined
	c.res.headers; // Headers
});

// internally ovr creates the Response with final values:
new Response(c.res.body, { status: c.res.status, headers: c.res.headers });
```

The prepared response can be set in three ways:

```tsx
Route.get("/api/:id", (c) => {
	// 1. Assign the values directly
	c.res.body = "body";

	// 2. Using the following helper functions to set common headers
	c.html(body, status); // HTML
	c.text(body, status); // plain text
	c.json(data, status); // JSON
	c.redirect(location, status); // redirect
	if (c.etag(str)) return; // ETag - sets 304 if match

	// 3. Returning anything from middleware to be passed into
	//    `render.stream()` and assigned to c.res.body
	return <p>streamed</p>;
});
```

#### Resolving the return value

1. Response

At the most basic level, you can return a `Response` from middleware to handle a request.

```ts
app.use(() => new Response("Hello world"));
```

2. Other

Any value that is returned from middleware will be passed into [`render.stream`](/02-components#stream) and assigned to `Context.res.body`.

Returning a value sets the content type header to HTML unless it has already been set. HTML will be escaped during the render while other content types will not. This makes it easy to stream other types of content than HTML.

For example, to create a [server sent event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), simply set the content type header and return an async generator function:

```ts
// simulate latency
const delay = () => new Promise((r) => setTimeout(r, 500));

Route.get("/api/:id", (c) => {
	// set the content type header to create a SSE
	c.res.headers.set("content-type", "text/event-stream");

	// passed into `render.stream`
	return async function* () {
		yield "data: server\n\n";
		await delay();
		yield "data: sent\n\n";
		await delay();
		yield "data: event\n\n";
	};
});
```

> You can even use JSX to create streams of other types of content too!
