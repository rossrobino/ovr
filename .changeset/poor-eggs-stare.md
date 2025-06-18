---
"ovr": patch
---

fix: single falsy child not being rendered

For example:

```tsx
<div>{0}</div>
```

Was not rendering. Now it correctly produces `"<div>0</div>"`
