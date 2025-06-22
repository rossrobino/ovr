---
title: Memoization
description: How to deduplicate and cache function calls in ovr.
---

## Context cache

If you need to display a component in multiple locations, you need to ensure you aren't fetching the same data multiple times. ovr provides built in memoization on the request context you can utilize on any function to memoize it for the request.

```tsx
import { Context } from "ovr";
import { db } from "@/lib/db";

function getData(id: number) {
	const c = Context.get(); // acquire the context

	return c.memo(db.query)(id); // memoize the function/argument
}

async function Data(props: { id: number }) {
	const data = await getData(props.id); // automatically deduped and cached

	return <span>{data}<span>;
}
```

This will deduplicate multiple calls to the same function with the with the same arguments and cache the result.

## Create your own cache

The `Memo` class can also be utilized outside of the application context if you need to cache across requests. It's generally safer to cache per request using `Context.memo`---especially for user specific or sensitive information.

```ts
import { Memo } from "ovr";

const memo = new Memo();

const add = memo.use((a: number, b: number) => a + b);

add(1, 2); // runs
add(1, 2); // cached
add(2, 3); // runs again, saves the new result separately
```
