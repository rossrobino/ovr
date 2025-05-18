```bash
npm i ovr
```

## Overview

**ovr** is a [lightweight](https://bundlephobia.com/package/ovr) toolkit for building fast, streaming web applications using asynchronous JSX and a modern Fetch API-based router.

```tsx
import { App } from "ovr";

const app = new App();

app.get("/", () => <p>hello world</p>);
```

ovr is designed for server-side rendering (SSR) where performance and Time-To-First-Byte (TTFB) matter. ovr evaluates components concurrently but streams the resulting HTML **in order**, allowing browsers to fetch critical assets quickly and render content progressively as it arrives.

```tsx
async function* Component() {
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>later</p>;
}
```

## Features

- **Asynchronous Streaming JSX**: Write components that perform async operations (like data fetching) directly. ovr handles concurrent evaluation and ordered streaming output.
- **Performance Focused**: Deliver HTML faster to the client by streaming content as it becomes ready, improving performance and TTFB.
- **Minimal & Platform Agnostic**: Uses standard JavaScript/Web APIs, allowing it to run in Node.js, Deno, Bun, Cloudflare Workers, and more.
- **Fetch API Router**: A modern, flexible router built on the standard Fetch API `Request` and `Response` objects.
- **[Trie](https://en.wikipedia.org/wiki/Radix_tree)-Based Routing**: Efficient and fast route matching, supporting static paths, parameters, and wildcards with clear prioritization. Performance does not degrade as you add more routes.

## JSX

ovr provides an asynchronous JSX runtime designed for server-side rendering. Instead of buffering the entire HTML string in memory, it produces an `AsyncGenerator` that yields HTML chunks.

When you render multiple asynchronous components (e.g., components fetching data), ovr initiates their evaluation concurrently. As each component resolves, its corresponding HTML is generated.

ovr ensures that these HTML chunks are yielded in the original order, even if components finish evaluating out of order. This allows the browser to start parsing and rendering the initial parts of your page while waiting for slower data fetches further down, significantly improving perceived load times. This all takes place without any client-side JavaScript, streaming the HTML in-order by default.

For example, ovr will immediately send the `<head>` of your document for the browser to start requesting the linked assets. Then the rest of the page streams in as it becomes available.

## Get started

ovr can be used in any Fetch API compatible runtime. `app.fetch` takes a `Request` and returns a `Response`, you can use it as the fetch handler with any of the following tools and more.

- [Vite + domco](https://github.com/rossrobino/domco) - `npm create domco` and select the `ovr` framework option.
- [Bun HTTP server](https://bun.sh/docs/api/http)
- [Deno HTTP server](https://docs.deno.com/runtime/fundamentals/http_server/)
- [Node + srvx](https://github.com/h3js/srvx)

Add the following options to your `tsconfig.json` to enable the JSX transform:

```json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "ovr" } }
```

## Usage

JSX evaluates to an `AsyncGenerator`, with this, the `App` creates an in-order stream of components.

```tsx
// Basic component with props
const Component = (props: { foo: string }) => <div>{props.foo}</div>;

// Components can be asynchronous
// for example you can `fetch` directly in a component
const Data = async () => {
	const res = await fetch("...");
	const data = await res.json();

	return <div>{JSON.stringify(data)}</div>;
};

// Components can also be generators
async function* Generator() {
	// `yield` values instead of `return`
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>after</p>;
}

const Page = () => (
	<>
		<Component foo="bar" />

		{/* These three components await in parallel when this page is called. */}
		{/* Then they will stream in order as soon as they are ready. */}
		<Generator />
		<Data />
		<Data />
	</>
);
```

You can `return` or `yield` most data types from a component, they will be rendered as you might expect.

```tsx
function* DataTypes() {
	yield null; // ""
	yield undefined; // ""
	yield false; // ""
	yield true; // ""

	yield "string"; // "string"
	yield 0; // "0";
	yield BigInt(9007199254740991); // "9007199254740991"
	yield { foo: "bar" }; // '{ "foo": "bar" }'
	yield <p>jsx</p>; // "<p>jsx</p>"
	yield ["any-", "iterable", 1, null]; // "any-iterable1"
	yield () => "function"; // "function"
	yield async () => "async"; // "async"
}
```

> [!WARNING]
>
> ovr does not escape HTML automatically, use the `escape` function provided.

## App

```ts
import { App } from "ovr";

const app = new App();

app.get("/", (c) => c.text("Hello world"));
```

### Configuration

Optional configuration when creating the app.

```ts
const app = new App({
	// redirect trailing slash preference
	trailingSlash: "always",
});

// global middleware
app.use(async (c, next) => {
	// customize the not found response
	c.notFound = (c) => c.res("custom", { status: 404 });

	// add a global error handler
	c.error = (c, error) => c.res(error.message, { status: 500 });

	// base HTML to inject head and body elements into, this is the default
	c.base =
		'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';

	await next();
});
```

### Context

`Context` contains context for the current request.

```tsx
app.get("/api/:id", (c) => {
	// Request Info
	c.req; // Original Request object
	c.url; // Parsed URL object
	c.params; // Type-safe route parameters (e.g., { id: "123" })
	c.route; // Matched Route object (contains pattern, store)

	// Response Building Methods
	c.res(body, init); // Generic response (like `new Response()`)
	c.html(body, status); // Set HTML response
	c.text(body, status); // Set plain text response
	c.json(data, status); // Set JSON response
	c.redirect(location, status); // Set redirect response

	// JSX Page Building Methods (Leverages Streaming JSX)
	c.head(<meta name="description" content="..." />); // Add elements to <head>
	c.layout(MainLayout); // Wrap page content with layout components
	c.page(<UserProfilePage userId={c.params.id} />); // Render JSX page, streaming enabled!

	// Other Utilities
	c.memo(fn); // Memoize a function to dedupe async operations and cache the results
	c.etag("content-to-hash"); // Generate and check ETag for caching
	c.build(); // (Internal) Builds the final Response object
});
```

### Examples

#### Overview

```tsx
// Basic
app.get("/", (c) => c.text("Hello world"));

// Return JSX as a streamed HTML response
app.get("/about", () => <h1>About</h1>);

// Params
app.post("/api/:id", (c) => {
	// matches "/api/123"
	c.params; // { id: "123" }
});

// Wildcard - add an asterisk `*` to match all remaining segments in the route
app.get("/files/*", (c) => {
	// c.params["*"] contains the matched wildcard path (e.g., "images/logo.png")
	return c.text(`Serving file: ${c.params["*"]}`);
});

// Other or custom methods
app.on("METHOD", "/pattern", () => {
	// ...
});

// Global middleware
app.use(async (c) => {
	// ...
});
```

| Return Value        | Action                     |
| ------------------- | -------------------------- |
| `Response`          | Passed into `context.res`  |
| `ReadableStream`    | Assigned to `context.body` |
| other truthy values | Passed into `context.page` |
| falsy values        | None                       |

#### Middleware

Add middleware to a route, the first middleware added to the route will be called, and the `next` middleware can be called within the first by using `await next()`. Middleware is based on [koa-compose](https://github.com/koajs/compose).

```ts
app.get(
	"/multi",
	async (c, next) => {
		// middleware
		console.log("pre"); // 1
		await next(); // calls the next middleware below
		console.log("post"); // 3
	},
	() => console.log("final"); // 2
);
```

`Context` is passed between between each middleware that is stored in the matched `Route`. After all the handlers have been run, the `Context` will `build` and return the final response.

#### Multiple patterns

Apply handlers to multiple patterns at once with type safe parameters.

```ts
app.get(["/multi/:param", "/pattern/:another"], (c) => {
	c.param; // { param: string } | { another: string }
});
```

### fetch

Use the `fetch` method to create a response,

```ts
const res = await app.fetch(new Request("https://example.com/"));
```

or use in a framework.

```ts
// next, sveltekit, astro...
export const GET = app.fetch;
```

```ts
// bun, deno, cloudflare...
export default app;
```

## Trie

[App](#app) is built using the `Trie` and `Route` classes. You can build your own trie based router by importing them.

The trie is forked and adapted from [memoirist](https://github.com/SaltyAom/memoirist) and [@medley/router](https://github.com/medleyjs/router).

```ts
import { Trie, Route } from "ovr";

// specify the type of the store in the generic
const trie = new Trie<string>();
const route = new Route("/hello/:name", "store");

trie.add(route);

const match = trie.find("/hello/world"); // { route, params: { name: "world" } }
```

### Prioritization

The trie prioritizes matches in this order: **Static > Parametric > Wildcard**.

Given three routes are added in any order,

```ts
trie.add(new Route("/hello/world", "store"));
trie.add(new Route("/hello/:name", "store"));
trie.add(new Route("/hello/*", "store"));
```

The following pathnames would match the corresponding patterns.

| pathname              | Route.pattern    |
| --------------------- | ---------------- |
| `"/hello/world"`      | `"/hello/world"` |
| `"/hello/john"`       | `"/hello/:name"` |
| `"/hello/john/smith"` | `"/hello/*"`     |

More specific matches are prioritized. First, the static match is found, then the parametric, and finally the wildcard.

## Helpers

### Page

### Action
