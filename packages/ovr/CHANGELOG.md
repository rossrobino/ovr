# ovr

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
