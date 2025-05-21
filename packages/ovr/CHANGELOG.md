# ovr

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
