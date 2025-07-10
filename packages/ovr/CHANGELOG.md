# ovr

## 4.3.0

### Minor Changes

- 46da501: feat: Add `toStream` helper function to create a `ReadableStream` from a `JSX.Element`.

## 4.2.7

### Patch Changes

- 363b93c: fix: `crossorigin` attribute should be `boolean` instead of `true`

## 4.2.6

### Patch Changes

- 5796b5d: fix: allow `crossorigin` boolean attribute

## 4.2.5

### Patch Changes

- 87fab37: fix: Adds `ResponseFinalized` errors to any properties of `Context` that cannot be set after the `Response` has been finalized.

## 4.2.4

### Patch Changes

- 6ad1ed2: fix: Better error handling for `Context.head`.

  If `Context.head` is called after the response is already being read, an error will be thrown since it will have no effect.

## 4.2.3

### Patch Changes

- 4e64d54: fix: Remove unneeded check from `Context.page`

## 4.2.2

### Patch Changes

- e801bee: patch: Removes undocumented support for `className` and `htmlFor` - if used, just use `class` and `for` respectively
- e801bee: perf: Update `toString` to use `Array.fromAsync`

## 4.2.1

### Patch Changes

- 2170567: perf: Stream optimizations

## 4.2.0

### Minor Changes

- a6e7dfc: feat: Add `pathname` and `Params` to helpers.

  Helpers have a two new properties.

  ```tsx
  const get = new Get("/hello/:name", (c) => <h1>Hello {c.params.name}</h1>);
  ```

  ### Params

  `Params` is a type helper to get the specific params of the route based on the pattern.

  ```ts
  typeof get.Params; // { name: string }
  ```

  ### Pathname

  The `pathname` method inserts params into the pattern. It provides type safety to ensure you always pass the correct params (or no params) to create the pathname.

  ```ts
  get.pathname({ name: "world" }); // `/hello/${string}`
  get.pathname({ name: "world" } as const); // "/hello/world"
  ```

  Using incorrect params results in an error:

  ```ts
  get.pathname({ id: "world" });
  // Error: 'id' does not exist in type '{ name: string; }'
  ```

  You can even create a list of exact pathnames for given params.

  ```ts
  const params = [
  	{ name: "world" },
  	{ name: "ross" },
  ] as const satisfies (typeof get.Params)[];

  const pathnames = params.map((p) => get.pathname(p));

  // ("/hello/world" | "/hello/ross")[]
  ```

### Patch Changes

- a6e7dfc: chore: Refactor helpers to extend a shared `Helper` class.

## 4.1.1

### Patch Changes

- 686ebc3: perf: minor performance improvements

## 4.1.0

### Minor Changes

- 5e53fc6: feat: Adds [more components](https://ovr.robino.dev/04-helpers) to `Get` and `Post` helpers.

## 4.0.0

### Major Changes

- 4aa4ae5: rename: Renames `Page` and `Action` helpers to `Get` and `Post` respectively.

### Minor Changes

- 4aa4ae5: feat: Allow empty `app.base` to return HTML partials

### Patch Changes

- 4aa4ae5: fix: yield with `setImmediate` every 50 iterations to properly cancel request for sync generators.
- 4aa4ae5: fix: memory leak in `merge` with promise that never resolved

## 3.0.1

### Patch Changes

- 5a757b5: publish source and declaration maps for go to definition
- 22b88a2: fix: Adds better JSDoc and types for `jsx` function.
- b5ebc6c: fix: single falsy child not being rendered

  For example:

  ```tsx
  <div>{0}</div>
  ```

  Was not rendering. Now it correctly produces `"<div>0</div>"`

## 3.0.0

### Major Changes

- 7c5a307: feat: Escape content and attributes automatically.

  This fixes one of the major shortcomings of ovr, previously it did not automatically escape content or attribute strings. Now ovr will automatically escape any children and attribute content.

  `jsx` and `toGenerator` now are `AsyncGenerator<Chunk>` instead of `AsyncGenerator<string>`. When a `Chunk` is created, its `value` is escaped by default.

  Now, to render HTML directly without escaping, create a new `Chunk` with the second argument `safe` set to `true`.

  ```tsx
  import { Chunk } from "ovr";

  const html = "<p>Safe to render</p>";

  function Component() {
  	return <div>{new Chunk(html, true)}</div>;
  }
  ```

- 7c5a307: breaking: `escape` is now a static method of the `Chunk` class

## 2.1.0

### Minor Changes

- bfbf643: feat: add CSRF middleware

## 2.0.4

### Patch Changes

- c41f753: fix: better error handling for streams

## 2.0.3

### Patch Changes

- f01c132: fix: Prevent event loop blocking during large HTML generation

  Added periodic event loop yielding to prevent blocking when generating large amounts of HTML. This ensures streaming chunks are properly flushed to the browser even when processing thousands of elements.

  Previously, generating large HTML structures (like tables with many rows) could block the event loop, causing the browser to stop receiving chunks mid-stream. The page would appear to load partially then hang, especially noticeable with datasets over 1000+ items.

  Now ovr automatically yields control back to the event loop periodically, allowing the streaming response to flush chunks consistently throughout the generation process.

- f01c132: fix: Prevent memory buildup when rendering large sync generators

  When a synchronous generator function is encountered, ovr now processes and streams each yielded element individually instead of collecting all values into memory first. This prevents memory exhaustion when rendering large datasets like tables with thousands of rows.

  ```tsx
  const Component = () => {
  	return (
  		<div>
  			{function* () {
  				for (const item of items) {
  					yield <Item item={item} />;
  				}
  			}}
  		</div>
  	);
  };
  ```

  Previously, a generator yielding 10,000 JSX elements would create all 10,000 objects in memory before streaming began. Now each element is processed and streamed immediately, keeping memory usage constant regardless of dataset size.

  Users can still choose arrays when parallel processing is important than memory efficiency.

  ```tsx
  const Component = () => {
  	return (
  		<div>
  			{items.map((item) => (
  				<Item item={item} />
  			))}
  		</div>
  	);
  };
  ```

## 2.0.2

### Patch Changes

- 16621f3: fix: autocomplete other attributes for Action.Form and Page.Anchor
- 492dbc5: add `webkitdirectory` attribute to input element type

## 2.0.1

### Patch Changes

- 678d183: fix: don't yield empty strings

## 2.0.0

### Major Changes

- b32c519: Changes `context()` to a static `get` method on `Context`
- 772afad: removes `app.mount`

  There were many features not supported when mounting a router to another. May revisit at some point.

- 2d11a81: Moves `App` config out of the constructor to top level properties that are passed through to `Context`.
- dc1425b: Removes `start`/`c.state` to simplify the API.

  Use `app.use` to run global middleware instead.

- 5642431: feat: Return `JSX.Element` or a `Response` from middleware

  This is breaking, if you were returning something random from middleware before it will now be used.

- bd8a561: Removes `Suspense` component - too hacky to use this css only implementation.
- 78055a1: Renames `Router` to `App`

### Minor Changes

- 9edb66b: feat: add `Memo` - `context.memo` will memoize functions per request. Or use independently with `Memo.use`.
- 031942e: feat: adds `Page` and `Action` helpers, and `app.add` register

### Patch Changes

- bd8a561: fix: only inject extra `<div>` for safari streaming bug if UA is safari

## 1.4.0

### Minor Changes

- 893f441: feat: add `context` async local storage function to get the context anywhere.

## 1.3.0

### Minor Changes

- a97873a: feat: use multiple methods with `on`

## 1.2.4

### Patch Changes

- 7093dbe: intrinsic element interface

## 1.2.3

### Patch Changes

- 455e4cd: fix: text headers

## 1.2.2

### Patch Changes

- 39bb91e: types: update `popover` attr type

## 1.2.1

### Patch Changes

- b72bd26: fix: `true` should not render instead of rendering `"true"`

## 1.2.0

### Minor Changes

- 926b0a7: feat: `Router.use` method to add global middleware

## 1.1.0

### Minor Changes

- 2651306: feat: add `Suspense` component - CSS only fallback loader for in-order streaming

### Patch Changes

- 0c92714: fix: safari streaming bug workaround
  - https://bugs.webkit.org/show_bug.cgi?id=252413
  - https://github.com/sveltejs/kit/issues/10315

- 091f36a: fix: type for void elements

  Omitting `children` broke attribute types, now `children = undefined` for void elements.

## 1.0.0

### Major Changes

- a99b756: release v1

## 0.1.1

### Patch Changes

- 435547a: allow other properties on the router

## 0.1.0

### Minor Changes

- 284a03f: release 0.1
