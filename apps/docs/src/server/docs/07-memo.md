---
title: Memoization
description: How to deduplicate and cache function calls in ovr.
---

## Context cache

If you need to display a component in multiple locations, you need to ensure you aren't fetching the same data multiple times. ovr provides built in memoization on the request context you can utilize on any function to memoize it for the request.

```tsx
import { Context } from "ovr";
import { db } from "@/lib/db";

async function Data(props: { id: number }) {
	// acquire the context
	const c = Context.get();

	// automatically deduped and cached for the current request
	const data = await c.memo(db.query)(props.id);

	return <span>{data}<span>;
}
```

This will deduplicate multiple calls to the same function with the with the same arguments and cache the result.

## Create your own cache

The `Memo` class can also be utilized outside of the application context if you need to cache across requests. It's generally safer to cache per request using `Context.memo`---especially for user specific or sensitive information. But if you have a long running server and need to cache public data, you can create a `Memo` outside of the app.

```ts
import { Memo } from "ovr";

const memo = new Memo();

const add = memo.use((a: number, b: number) => a + b);

add(1, 2); // runs
add(1, 2); // cached
add(2, 3); // runs again, saves the new result separately
```
