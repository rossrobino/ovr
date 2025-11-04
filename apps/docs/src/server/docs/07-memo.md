---
title: Memoization
description: How to deduplicate and cache function calls in ovr.
---

## Context cache

If you need to display a component in multiple locations with the same dynamic information, you need to ensure you aren't fetching the same data multiple times. ovr provides built-in memoization on the request context you can utilize on any function to cache the result for the current request.

```tsx
import { db } from "@/lib/db";
import type { Context } from "ovr";

async function Data({ c, id }: { c: Context; id: number }) {
	// automatically deduped and cached for the current request
	const data = await c.memo.use(db.query)(id);

	return <span>{data}</span>;
}
```

This will deduplicate multiple calls to the same function with the with the same arguments and cache the result. Every time `<Data />` is called with the same `id`, the result will be reused.

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
