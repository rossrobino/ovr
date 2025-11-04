---
title: Components
description: Async generator JSX
---

While components in ovr are authored like components in frameworks like [React](https://react.dev/), instead of creating UI elements, JSX evaluates to an `AsyncGenerator` that yields escaped `Chunk`s of HTML.

## Basic

If you aren't familiar with components, they are functions that return JSX elements. You can use them to declaratively describe and reuse parts of your HTML.

Define a `props` object as a parameter for a component to pass arguments to it.

```tsx
import type { JSX } from "ovr";

function Component(props: { children?: JSX.Element; color: string }) {
	return <div style={`color: ${props.color}`}>{props.children}</div>;
}
```

Now the component can be used as it's own tag within other components.

```tsx
function Page() {
	return (
		<div>
			<h1>Hello world</h1>
			<Component color="blue">Children</Component>
		</div>
	);
}
```

Props are passed in as attributes, while `children` is a special prop that is used to reference the element(s) in between the opening and closing tags.

ovr uses aligns with the standard (all lowercase) HTML attributes---attributes will be rendered exactly as they are written.

If you're coming from React, use `class` and `for` instead of `className` and `htmlFor` respectively. There is also no need to provide a `key` attribute in when rendering lists.

## Async

Components can be asynchronous, for example you can `fetch` directly in a component.

```tsx
async function Data() {
	const res = await fetch("...");
	const data = await res.text();

	return <div>{data}</div>;
}
```

## Generator functions

Components can also be generator functions for more fine grained control and [memory optimization](/demo/memory). When utilizing generators `yield` values instead of `return`.

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

The order of your components does not affect when they are evaluated, but it does impact when they will display. If `Username` is the slowest component, `Generator` and `Data` will be queued but only streamed after `Username` completes.

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

To render HTML directly without escaping, use the `Chunk.safe` method.

```tsx
import { Chunk } from "ovr";

const html = "<p>Safe to render</p>";

function Component() {
	return <div>{Chunk.safe(html)}</div>;
}
```

## Running components

To evaluate components (for example, if you aren't using [`App`](/03-app) or need to call them separately), you can use these functions.

### toGenerator

Convert any `JSX.Element` into `AsyncGenerator<Chunk>` with `toGenerator`.

```tsx
import * as ovr from "ovr";

const Component = () => <p>element</p>;

const gen = ovr.toGenerator(Component);

for await (const chunk of gen) {
	// ...
}
```

### toStream

Turn a `JSX.Element` into a `ReadableStream<Uint8Array>`, this pipes the result of `toGenerator` into a `ReadableStream`.

```tsx
import * as ovr from "ovr";

const Component = () => <p>element</p>;

const stream = ovr.toStream(Component);

const response = new Response(stream, {
	"Content-Type": "text/html; charset=utf-8",
});
```

### toString

Convert any `JSX.Element` into a `string` of HTML with `toString`. This runs `toGenerator` joins the results into a single string.

```tsx
import * as ovr from "ovr";

const Component = () => <p>element</p>;

const str = await ovr.toString(Component);
```
