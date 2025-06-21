---
title: Components
description: Async generator JSX
---

While components in ovr are authored like components in frameworks such as React or Solid, there two main distinctions between ovr and other frameworks:

1. ovr only runs on the server.
2. JSX evaluates to an `AsyncGenerator` which produces escaped `Chunk`s of HTML.

## Basic

Define a `props` object as a parameter for a component to pass arguments to it.

```tsx
import type { JSX } from "ovr";

// Basic component with children
function Component(props: { children?: JSX.Element }) {
	return <div>{props.children}</div>;
}
```

## Async

Components can be asynchronous, for example you can `fetch` directly in a component.

```tsx
async function Data() {
	const res = await fetch("...");
	const data = await res.text();

	return <div>{data}</div>;
}
```

## Generators

Components can also be generators for more fine grained control. When utilizing generators `yield` values instead of `return`.

```tsx
async function* Generator() {
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>after</p>;
}
```

Using generators also reduces memory consumption which can be useful if you are rendering a large HTML page.

Instead of creating the entire component in memory by mapping through a large array:

```tsx
function List() {
	const arr = ["really", "big", "array"];

	return (
		<ul>
			{arr.map((el) => (
				<li>{el}</li>
			))}
		</ul>
	);
}
```

You can use a generator to `yield` elements as you iterate through the array.

```tsx
function List() {
	const arr = ["really", "big", "array"];

	return (
		<ul>
			{function* () {
				for (const el of arr) yield <li>{el}</li>;
			}}
		</ul>
	);
}
```

## Parallelization

These three components await in parallel when this component is evaluated. Then they will stream in order as soon as they are ready.

```tsx
function Page() {
	return (
		<main>
			<Username />
			<div>
				<Generator />
				<Data />
			</div>
		</main>
	);
}
```

The order of your components does not affect when they are evaluated, but it does impact when they will display. If `Username` is the slowest component, `Generator` and `Data` will be queued but only streamed after `Username` completes. In the case you need a slow component to display visually above a faster component, you can use CSS properties like `flex-direction: column-reverse` to swap their order.

## Return Types

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
