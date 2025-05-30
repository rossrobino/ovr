## Introduction

ovr is a [lightweight](https://bundlephobia.com/package/ovr) toolkit for building fast, streaming web applications with asynchronous JSX and a modern Fetch API-based router.

Designed to optimize performance and Time-To-First-Byte (TTFB), ovr evaluates components concurrently and streams HTML in order by producing an `AsyncGenerator<string>` that feeds directly into the streamed response.

```tsx
function Component() {
	return <p>hello world</p>;
}
```

For the paragraph above, ovr generates three strings:

```ts
"<p>"; // streamed immediately
"hello world"; // next
"</p>"; // last
```

While this is trivial for a paragraph, consider when a component is asynchronous:

```tsx
async function Username() {
	const user = await getUser(); // slow...
	return <span>{user.name}</span>;
}

function Component() {
	return (
		<p>
			hello <Username />
		</p>
	);
}
```

Instead of waiting for `getUser` to resolve before sending the entire component, ovr will send what it has immediately and stream the rest as it becomes available.

```ts
"<p>";
"hello "; // before getUser() resolves
// await getUser()...
"<span>";
"username";
"</span>";
"</p>";
```

Web browsers are built for streaming, they parse and paint HTML as it arrives. Most critically, the `<head>` of the document can be sent immediately to start the requests for linked assets (JavaScript, CSS, etc.) before the page has finished rendering.

<video aria-label="A video showing the network waterfall of a website loading. The HTML head element is streamed immediately, allowing JavaScript and CSS files to download while the rest of the HTML body streams in simultaneously." src="https://zsbsjhwuth2a2ck8.public.blob.vercel-storage.com/html-streaming-network-Owka5ZckQQIo791h0LQ771O5ZZV3Wb.mp4" autoplay loop muted loading="lazy" playsinline></video>

ovr's architecture gives you true streaming SSR and progressive rendering out of the box. No hydration bundle, no buffering---just HTML over the wire, as soon as it's ready.

### Features

- **Asynchronous Streaming JSX**: Write components that perform async operations (like data fetching) directly. ovr handles concurrent evaluation and ordered streaming output.
- **Type Safety**: ovr is written in TypeScript and supports type safe route patterns with parameters.
- **Built on the Fetch API**: A modern HTTP router built on the `Request` and `Response` objects.
- **[Trie](https://en.wikipedia.org/wiki/Radix_tree)-Based Routing**: Efficient and fast route matching, supporting static paths, parameters, and wildcards. Performance does not degrade as you add more routes.

## Get started

```bash
npm i ovr
```

ovr can be used in popular Fetch API compatible runtimes via [`app.fetch`](#fetch).

- [Vite + domco](https://github.com/rossrobino/domco) - `npm create domco` and select the `ovr` framework option.
- [Bun HTTP server](https://bun.sh/docs/api/http)
- [Deno HTTP server](https://docs.deno.com/runtime/fundamentals/http_server/)
- [Node + srvx](https://github.com/h3js/srvx)

Add the following options to your `tsconfig.json` to enable the JSX transform:

```json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "ovr" } }
```

## JSX

```tsx
// Basic component with props
function Component(props: { foo: string }) {
	return <div>{props.foo}</div>;
}

// Components can be asynchronous
// for example you can `fetch` directly in a component
async function Data() {
	const res = await fetch("...");
	const data = await res.json();

	return <div>{data}</div>;
}

// Components can also be generators
async function* Generator() {
	// `yield` values instead of `return`
	yield <p>start</p>; // streamed immediately
	await promise;
	yield <p>after</p>;
}

function Page() {
	return (
		<main>
			<Component foo="bar" />

			{/* These three components await in parallel when this page is called. */}
			{/* Then they will stream in order as soon as they are ready. */}
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
	yield { foo: "bar" }; // '{ "foo": "bar" }'
	yield <p>jsx</p>; // "<p>jsx</p>"
	yield ["any-", "iterable", 1, null]; // "any-iterable1"
	yield () => "function"; // "function"
	yield async () => "async"; // "async"
}
```

## App

To start using ovr, create a new `App` instance:

```ts
import { App } from "ovr";

const app = new App();
```

### Configuration

The following values can be customized after creating the `App`.

```ts
// redirect trailing slash preference - default is "always"
app.trailingSlash = "always";

// customize the not found response
app.notFound = (c) => c.html("Not found", 404);

// add an error handler
app.error = (c, error) => c.html(error.message, { status: 500 });

// base HTML to inject elements into, this is the default---must include <head> and <body> tags
app.base =
	'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';
```

### Overview

The `App` API is inspired by and works similar to frameworks such as [Hono](https://hono.dev/) and [Express](https://expressjs.com/). Below are some examples of how to create basic routes with the corresponding functions for each HTTP method.

```tsx
// API route
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
	c.params["*"]; // matched wildcard path (e.g., "images/logo.png")
});

// Multiple patterns
app.get(["/multi/:param", "/pattern/:another"], (c) => {
	c.param; // { param: string } | { another: string }
});

// Other or custom methods
app.on("METHOD", "/pattern", (c) => {
	// ...
});

// Global middleware
app.use(async (c) => {
	// ...
});
```

### Return values

Here are the various actions that occur based on the return type of the handler.

| Return Value                             | Action                     |
| ---------------------------------------- | -------------------------- |
| `Response`                               | Passed into `context.res`  |
| `ReadableStream`                         | Assigned to `context.body` |
| Other truthy values (JSX, strings, etc.) | Passed into `context.page` |
| Falsy values                             | None                       |

### Context

`Context` contains context for the current request and helpers to build a `Response`.

```tsx
app.get("/api/:id", (c) => {
	// Request info
	c.req; // original Request
	c.url; // parsed URL
	c.params; // type-safe route parameters ({ id: "123" })
	c.route; // matched Route (contains pattern, store)

	// Response building methods
	c.html(body, status); // Set HTML response
	c.text(body, status); // Set plain text response
	c.json(data, status); // Set JSON response
	c.redirect(location, status); // Set redirect response
	c.res(body, init); // Generic response (like `new Response()`)

	// JSX page building methods (Leverages Streaming JSX)
	c.head(<meta name="description" content="..." />); // add elements to <head>
	c.layout(Layout); // wrap page content with layout components
	c.page(<UserProfilePage userId={c.params.id} />); // stream JSX page (same as returning)

	// other utilities
	c.memo(fn); // memoize a function to dedupe async operations and cache the results
	c.etag("content-to-hash"); // generate and check ETag for caching

	// internal
	c.build(); // builds the final Response object
});
```

Context can be acquired from anywhere within the scope of a request handler with the `Context.get` method. `get` uses `AsyncLocalStorage` under the hood. This prevents you from having to prop drill the context to each component from the handler.

```tsx
import { Context } from "ovr";

function Component() {
	const c = Context.get(); // current request context
}
```

### Middleware

When multiple middleware handlers are added to a route, the first middleware will be called, and the `next` middleware can be dispatched within the first by using `await next()`. Middleware is based on [koa-compose](https://github.com/koajs/compose).

```ts
app.get(
	"/multi",
	async (c, next) => {
		console.log("1");

		await next(); // dispatches the next middleware below

		console.log("3");
	},
	() => {
		console.log("2");
	},
);
```

The same `Context` is passed into each middleware. After all the middleware have been run, the `Context` will `build` and return the final `Response`.

### Page

The `Page` helper encapsulates routes and creates links to them. This ensures if you change the route's pattern, you don't need to update all of the links to it throughout your application.

```tsx
import { Page } from "ovr";

const home = new Page("/", (c) => {
	return <p>hello world</p>;
});

<home.Anchor>Home</home.Anchor>; // <a> tag with preset `href` attribute
```

### Action

There is also an `Action` helper that will create a POST handler and a corresponding `Form` element that can be used within other components.

```tsx
import { Action } from "ovr";

const action = new Action((c) => {
	const data = await c.req.formData();

	// ...

	c.redirect("/", 303);
})

<action.Form>...</action.Form>; // <form> with preset `method` and `action` attributes
```

ovr will automatically create a unique pattern for the route based on a hash of the middleware provided.

You can also set the pattern manually:

```tsx
const action = new Action("/custom/pattern", (c) => {
	// ...
});
```

### add

Use the `add` method to register a `Page` or `Action` to your app.

```tsx
app.add(page); // single
app.add(page, action); // multiple
app.add({ page, action }); // object
app.add([page, action]); // array
// any combination of these also works
```

This makes it easy to create a module of pages and actions, and add them all at once.

```tsx
// home.tsx
import { Page, Action } from "ovr";

export const page = new Page("/", (c) => {
	// ...
});

export const action = new Action((c) => {
	// ...
});
```

```tsx
// app.tsx
import * as home from "./home";

app.add(home); // adds all exports
```

### fetch

Use the `fetch` method to create a `Response`.

```ts
const response = await app.fetch(new Request("https://example.com/"));
```

The `fetch` method can easily be plugged into other tooling built on the Fetch API:

```ts
// bun, deno, cloudflare, domco...
export default app;
```

```ts
// next, sveltekit, astro...
export const GET = app.fetch;
```

## Data fetching

Since components are asynchronous, data can be fetched directly within a component or in a middleware handler.

```tsx
async function Username() {
	const user = await getUser();

	return <span>{user.name}<span>;
}
```

### Memoization

If you need to display `Username` in multiple locations, you need to ensure you aren't fetching the same data multiple times. ovr provides built in memoization on the request context you can utilize on any function to memoize it for the request.

```tsx
import { Context } from "ovr";

async function Username() {
	const c = Context.get();
	const memoized = c.memo(getUser);
	const user = await memoized();

	return <span>{user.name}<span>;
}
```

This will deduplicate multiple calls to the same function with the with the same arguments and cache the result.

The `Memo` class can also be utilized outside of the application context if you need to cache across requests. Although, it's generally better to cache per request---especially for user specific or sensitive information.

```ts
import { Memo } from "ovr";

const memo = new Memo();

const add = memo.use((a: number, b: number) => a + b);

fn(1, 2); // runs
fn(1, 2); // cached
fn(2, 3); // runs again, saves the new result separately
```

## Trie

[App](#app) is built using the `Trie` and `Route` classes. You don't need to access these if you are using `App`, but you can build your own trie based router using them.

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

Given three routes are added in any order:

```ts
trie.add(new Route("/hello/world", "store"));
trie.add(new Route("/hello/:name", "store"));
trie.add(new Route("/hello/*", "store"));
```

The following pathnames would match the corresponding patterns:

| pathname              | Route.pattern    |
| --------------------- | ---------------- |
| `"/hello/world"`      | `"/hello/world"` |
| `"/hello/john"`       | `"/hello/:name"` |
| `"/hello/john/smith"` | `"/hello/*"`     |

More specific matches are prioritized. First, the static match is found, then the parametric, and finally the wildcard.
