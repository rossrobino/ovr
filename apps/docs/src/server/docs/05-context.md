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

## Page builders

There are also JSX page building properties which leverage streaming JSX.

```tsx
app.get("/api/:id", (c) => {
	// inject elements into <head> of `Context.base`
	c.head.push(<meta name="description" content="..." />);

	// wrap page content with layout components
	c.layouts.push(RootLayout, PageLayout);

	// stream JSX page (same as returning JSX)
	c.page(<UserProfilePage userId={c.params.id} />);
});
```

> Use `c.page` instead of returning JSX from middleware if you need to `await next()` afterwards or set a custom status on the HTML response.

### Layouts

To use the same layout for all pages, create a middleware that sets the layout and apply it globally with [`App.use`](/03-app#global-middleware).

Since `Context.layouts` expects layout _components_, if you need to pass other props besides `children` to a layout, create a function that returns the layout component.

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
	c.layouts.push(Layout(c));
	return next();
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

### Base HTML

Change the base HTML to inject elements into with the [`Context.head` and `Context.page`](/05-context#page-builders) methods.

```ts
c.base = ""; // defaults to empty string (send HTML partials)
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
