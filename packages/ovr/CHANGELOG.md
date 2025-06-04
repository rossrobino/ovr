# ovr

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
