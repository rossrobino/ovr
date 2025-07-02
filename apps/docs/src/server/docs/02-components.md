---
title: Components
description: Async generator JSX
---

While components in ovr are authored like components in frameworks such as [React](https://react.dev/) or [Solid](https://docs.solidjs.com/), there two main distinctions between ovr and other frameworks:

1. ovr only runs on the _server_, there is no client runtime.
2. JSX evaluates to an `AsyncGenerator` that yields escaped `Chunk`s of HTML.

## Basic

If you aren't familiar with components, they are functions that return JSX elements. You can use them to declaratively describe and reuse parts of your HTML.

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

Components can also be generators for more fine grained control and [memory optimization](/demo/memory). When utilizing generators `yield` values instead of `return`.

```tsx
async function* Generator() {
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>after</p>;
}
```

## Parallelization

These three components await in [parallel](/demo/parallel) when this component is evaluated. Then they will stream in order as soon as they are ready.

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

> Check out the [source code](https://github.com/rossrobino/ovr/blob/main/packages/ovr/src/jsx/index.ts) for the `toGenerator` function to understand how ovr evaluates each data type.

## Raw HTML

To render HTML directly without escaping, create a new `Chunk` with the second argument `safe` set to `true`.

```tsx
import { Chunk } from "ovr";

const html = "<p>Safe to render</p>";

function Component() {
	return <div>{new Chunk(html, true)}</div>;
}
```

## To Generator

Convert any `Element` into `AsyncGenerator<Chunk>` with `toGenerator`.

```tsx
import { toGenerator } from "ovr";

const el = () => <p>element</p>;

const gen = toGenerator(el);

for await (const chunk of gen) {
	// ...
}
```

## To String

Convert any `Element` into a string of HTML with `toString`. This buffers all the elements into a single string.

```tsx
import { toString } from "ovr";

const el = () => <p>element</p>;

const str = await toString(el);
```
