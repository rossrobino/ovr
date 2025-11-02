---
"ovr": minor
---

feat(app): Align `App.fetch` signature to `window.fetch`.

The `App.fetch` method now has the same call signature as the standard [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch).

In addition to inputting a `Request` to `App.fetch`, you can now input a `string` or `URL`. A second `options` parameter is also available to provide options to apply to the request.
