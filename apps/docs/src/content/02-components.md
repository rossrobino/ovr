---
title: Components
description: Async generator JSX
---

## Overview

Components in ovr are similar to components in frameworks like React and Solid. You can define a `prop` object as an argument for a component.

```tsx
import type { JSX } from "ovr";

// Basic component with props
function Component(props: { children?: JSX.Element }) {
	return <div>{props.children}</div>;
}
```

Components can be asynchronous, for example you can `fetch` directly in a component.

```tsx
async function Data() {
	const res = await fetch("...");
	const data = await res.json();

	return <div>{data}</div>;
}
```

Components can also be generators:

```tsx
async function* Generator() {
	// `yield` values instead of `return`
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>after</p>;
}
```

These three components await in parallel when this page is called. Then they will stream in order as soon as they are ready.

```tsx
function Page() {
	return (
		<main>
			<Generator />
			<Data />
			<Data />
		</main>
	);
}
```

You can `return` or `yield` most data types from a component, they will be rendered as you might expect:

```tsx
function* DataTypes() {
	yield null; // ""
	yield undefined; // ""
	yield false; // ""
	yield true; // ""

	yield "string"; // "string"
	yield 0; // "0";
	yield BigInt(9007199254740991); // "9007199254740991"
	yield <p>jsx</p>; // "<p>jsx</p>"
	yield ["any-", "iterable", 1, null]; // "any-iterable1"
	yield () => "function"; // "function"
	yield async () => "async"; // "async"
}
```

## Raw HTML

To render HTML directly without escaping, create a new `Chunk` with the second argument `safe` set to `true`.

```tsx
import { Chunk } from "ovr";

const html = "<p>Safe to render</p>";

function Component() {
	return <div>{new Chunk(html, true)}</div>;
}
```
