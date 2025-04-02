---
"ovr": patch
---

fix: type for void elements

Omitting `children` broke attribute types, now `children = undefined` for void elements.
