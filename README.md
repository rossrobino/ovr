# ovr

```bash
npm i ovr
```

- [JSX](#jsx) - Asynchronous `jsx` to HTML import source built for streaming by default
- [Router](#router) - HTTP router built on the Fetch API
- [Trie](#trie) - radix [trie](https://en.wikipedia.org/wiki/Radix_tree) data structure used within `Router`

## JSX

Write async `jsx` components and output an async generator of HTML.

This was written to be used for server-side templating if you don't want to add a larger UI framework. There are no JS runtime specific APIs used, so this package can be used anywhere.

> [!WARNING]
>
> `ovr` does not escape HTML automatically, use the `escape` function provided.

### Configuration

Add the following values to your `tsconfig.json`:

```json
{
	"jsx": "react-jsx",
	"jsxImportSource": "ovr"
}
```

### Usage

Add props to a component.

```tsx
const Component = (props: { foo: string }) => <div>{props.foo}</div>;
```

Components can be asynchronous, for example you can fetch directly in a component.

```tsx
const Data = async () => {
	const res = await fetch("...");
	const data = await res.json();

	return <div>{JSON.stringify(data)}</div>;
};
```

`jsx` evaluates to an `AsyncGenerator`, with this, the `Router` creates an in-order stream of components.

These two `Data` components `fetch` in parallel when this component is called, then they will stream in-order as soon as they are ready.

```tsx
const All = () => {
	return (
		<div>
			<Component foo="bar" />
			<Data />
			<Data />
		</div>
	);
};
```

Components can also be generators, `yield` values instead of `return`.

```tsx
async function* Generator() {
	yield <p>start</p>;
	await promise;
	yield <p>after</p>;
}
```

You can `return` or `yield` most data types from a component, they will be rendered as you might expect.

```tsx
function* DataTypes() {
	yield null; // ""
	yield undefined; // ""
	yield false; // ""
	yield "string"; // "string"
	yield 0; // "0";
	yield BigInt(9007199254740991); // "9007199254740991"
	yield true; // "true"
	yield { foo: "bar" }; // '{ "foo": "bar" }'
	yield <p>jsx</p>; // "<p>jsx</p>"
	yield ["any-", "iterable", 1, null]; // "any-iterable1"
	yield () => "function"; // "function"
	yield async () => "async"; // "async"
}
```

## Trie

[Router](#router) is built using these trie `Node` and `Route` classes. You can build your own trie based router by importing them.

The trie is forked and adapted from [memoirist](https://github.com/SaltyAom/memoirist) and [@medley/router](https://github.com/medleyjs/router).

```ts
import { Node, Route } from "ovr";

// specify the type of the store in the generic
const trie = new Node<string>();
const route = new Route("/hello/:name", "store");

trie.add(route);

const match = trie.find("/hello/world"); // { route, params: { name: "world" } }
```

### Prioritization

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

## Router

```ts
import { Router } from "ovr";

const router = new Router();

router.get("/", (c) => c.text("Hello world"));
```

### Configuration

Optional configuration when creating the router.

```ts
const router = new Router({
	// redirect trailing slash preference
	trailingSlash: "always",

	// runs at the start of each request
	start(c) {
		// customize the not found response
		c.notFound = (c) => c.res("custom", { status: 404 });

		// add a global error handler
		c.error = (c, error) => c.res(error.message, { status: 500 });

		// base HTML to inject head and body elements into, this is the default
		c.base =
			'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';

		// return state to use in middleware
		return { foo: "bar" };
	},
});
```

### Context

`Context` contains context for the current request.

```ts
router.get("/api/:id", (c) => {
	// values
	c.req; // Request
	c.url; // URL
	c.params; // type safe params: "/api/123" => { id: "123" }
	c.route; // Matched Route
	c.state; // whatever is returned from `config.start`, for example an auth helper or a key/value store

	// methods
	c.res; // create a response
	c.html; // html helper
	c.json; // json helper
	c.text; // text helper
	c.page; // create a page response with elements
	c.head; // inject elements into head
	c.layout; // add layout around the page
});
```

### Examples

#### Basic

```ts
router.get("/", (c) => c.text("Hello world"));
```

#### Param

```ts
router.post("/api/:id", (c) => {
	// matches "/api/123"
	c.param; // { id: "123" }
});
```

#### Wildcard

Add an asterisk `*` to match all remaining segments in the route.

```ts
router.get("/wild/*", () => {
	// matches "/wild/anything/..."
});
```

#### Other or custom methods

```ts
router.on("METHOD", "/pattern", () => {
	// ...
});
```

#### Middleware

Add middleware to a route, the first middleware added to the route will be called, and the `next` middleware can be called within the first by using `await next()`.

```ts
router.get(
	"/multi",
	async (c, next) => {
		// middleware
		console.log("pre"); // 1

		await next(); // calls the next middleware below

		console.log("post"); // 3
	},
	(c) => {
		console.log("final"); // 2
		c.text("hello world");
	},
);
```

`Context` is passed between between each middleware that is stored in the matched `Route`. After all the handlers have been run, the `Context` will `build` and return the final response.

#### Multiple patterns

Apply handlers to multiple patterns at once with type safe parameters.

```ts
router.get(["/multi/:param", "/pattern/:another"], (c) => {
	c.param; // { param: string } | { another: string }
});
```

### fetch

Use the `fetch` method to create a response,

```ts
const res = await router.fetch(new Request("https://example.com/"));
```

or use in an existing framework.

```ts
// next, sveltekit, astro...
export const GET = router.fetch;
```

```ts
// bun, deno, cloudflare...
export default router;
```

### mount

Mount routers onto another with a base pattern.

```ts
const app = new Router();

const hello = new Router();

hello.get("/world", (c) => c.text("hello world"));

app.mount("/hello", hello); // creates route at "/hello/world"
```
