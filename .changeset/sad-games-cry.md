---
"ovr": major
---

feat: Return `JSX.Element` or a `Response` from middleware

This is breaking, if you were returning something random from middleware before it will now be passed into `context.page`.

| Middleware Return Value | Action                     |
| ----------------------- | -------------------------- |
| `Response`              | Passed into `context.res`  |
| `ReadableStream`        | Assigned to `context.body` |
| other truthy values     | Passed into `context.page` |
| falsy values            | None                       |
