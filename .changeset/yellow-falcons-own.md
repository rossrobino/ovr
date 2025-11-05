---
"ovr": major
---

feat(app)! Built-in basic CSRF protection.

`csrf` middleware is now built in to `App` instead of a separate middleware. Set `options.csrf` to `false` to disable. If you were using the middleware, you can remove.

In addition, the protection now checks the [`Sec-Fetch-Site`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site) header and falls back to checking the `Origin`.
