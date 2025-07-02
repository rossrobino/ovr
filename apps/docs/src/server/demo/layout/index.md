---
title: Layout
description: Create a layout to reuse on multiple pages.
---

Use the `Context.layout` method to add a layout to a route. To use the same layout for all pages, create a middleware that sets the layout and apply it globally with `app.use`.

```tsx
import { App, type JSX } from "ovr";

const app = new App();

const Layout = (props: { children?: JSX.Element }) => {
	return (
		<>
			<header>...</header>
			<main>{props.children}</main>
			<footer>...</footer>
		</>
	);
};

app.use((c, next) => {
	c.layout(Layout);
	return next();
});
```
