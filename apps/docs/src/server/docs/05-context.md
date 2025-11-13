---
title: Context
description: Understanding the ovr request context.
---

`Context` contains context for the current request and helpers to build a `Response`.

## Request information

Access information about the current request such as the [`url`](https://developer.mozilla.org/en-US/docs/Web/API/URL) or [`params`](/06-routing#parameters).

```ts
app.get("/api/:id", (c) => {
	c.req; // original `Request`
	c.url; // parsed web `URL`
	c.params; // type-safe route parameters { id: "123" }
	c.route; // matched `Route` (contains `pattern`, `store`) | null
});
```

## Response builders

The context contains methods to build your final `Response`.

Easily set the response with common [content type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type) headers or create a redirect response.

```tsx
app.get("/api/:id", (c) => {
	c.html(body, status); // HTML
	c.text(body, status); // plain text
	c.json(data, status); // JSON
	c.redirect(location, status); // redirect
	c.res(body, init); // generic response (like `new Response()`)
});
```

### Not found

Customize the `notFound` handler by reassigning `Context.notFound`.

```ts
c.notFound = (c) => {
	c.text("Not found", 404);
	c.headers.set("cache-control", "no-cache");
};
```

## Utilities

### Entity tag

Generates an [entity tag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag) from a hash of the string provided. If the tag matches, the response will be set to [`304: Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304) and the function will return `true`.

```tsx
app.get("/api/:id", (c) => {
	const html = `<p>Content</p>`;

	const matched = c.etag(html);

	if (matched) {
		// 304: Not Modified
		return;
	}

	c.html(html);
});
```
