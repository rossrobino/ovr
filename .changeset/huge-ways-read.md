---
"ovr": patch
---

types: Add `number` type in addition to `string` for a variety of common HTML attributes (no runtime changes).

For example, you can now pass a `number` directly to the `<input>`'s `value` attribute without getting a type error.

```diff
- <input value={String(1)} />
+ <input value={1} />
```
