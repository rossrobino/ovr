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
	c.route; // matched `Route` (contains `pattern`, `store`)
});
```

## Response builders

The context contains methods to build your final `Response`.

### Content types

Easily set the response with common [content type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type) headers.

```tsx
app.get("/api/:id", (c) => {
	c.html(body, status); // HTML
	c.text(body, status); // plain text
	c.json(data, status); // JSON
	c.redirect(location, status); // redirect
	c.res(body, init); // generic response (like `new Response()`)
});
```

### Page builders

There are also JSX page building methods which leverage streaming JSX.

```tsx
app.get("/api/:id", (c) => {
	// inject elements into <head>
	c.head(<meta name="description" content="..." />);

	// wrap page content with layout components
	c.layout(RootLayout, PageLayout);

	// stream JSX page (same as returning JSX)
	c.page(<UserProfilePage userId={c.params.id} />);
});
```

#### Layouts

Since `Context.layout` expects layout _components_, if you need to pass other props besides `children` to a layout, create a function that returns the layout component.

```tsx
// layout.tsx
import type { Context, JSX } from "ovr";

export const Layout = (c: Context) => (props: { children: JSX.Element }) => {
	return (
		<>
			<header>{c.url.pathname}</header>
			<main>{props.children}</main>
		</>
	);
};
```

```tsx
// app.tsx
import { Layout } from "./layout.tsx";

// ...

app.use((c, next) => {
	c.layout(Layout(c));
	return next();
});
```

## Utilities

### Memo

Memoize a function to dedupe async operations and cache the results. See [memoization](/07-memo) for more details.

```tsx
app.get("/api/:id", (c) => {
	c.memo(fn);
});
```

### Entity tag

Generates an [entity tag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag) from a hash of the string provided. If the tag matches, the response will be set to [`304: Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304) and the funciton will return `true`.

```tsx
app.get("/api/:id", (c) => {
	const html = `<p>Content</p>`;

	const matched = c.etag(html);

	if (matched) {
		// 304: Not Modified
		return;
	}

	return c.html(html);
});
```
