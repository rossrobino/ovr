---
"ovr": major
---

refactor(context)!: Refactor properties on `Context`

BREAKING CHANGES:

### `head` and `layouts`

Expose `layouts` and `head` directly instead of through helper methods. This provides greater control over which layouts are used for each handler. For example, you can `unshift` the root layout to remove it now instead of just appending.

```diff
- c.layout(Layout);
+ c.layouts.push(Layout);
```

```diff
- c.head(Layout);
+ c.head.push(Layout);
```

### `memo`

`Context.memo` is now the actual `Memo` instance instead of a wrapper for `memo.use`.

```diff
- c.memo(fn);
+ c.memo.use(fn);
```
