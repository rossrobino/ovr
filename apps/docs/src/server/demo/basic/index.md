---
title: Basic
description: Create a page and POST request handler with ovr.
---

A basic page created with the [`Get` helper](/04-helpers#get).

```tsx
import { Get } from "ovr";

export const page = new Get("/demo/basic", (c) => {
	c.head(<title>Basic</title>);

	return <h1>Basic</h1>;
});
```
