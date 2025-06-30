---
"ovr": patch
---

fix: Better error handling for `Context.head`.

If `Context.head` is called after the response is already being read, an error will be thrown since it will have no effect.
