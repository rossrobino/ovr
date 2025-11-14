---
"ovr": major
---

refactor(types)!: `JSX` is no longer exported from the main entry, instead `Element` and `IntrinsicElements` are exported directly.

```diff
- import type { JSX } from "ovr";
+ import type { JSX } from "ovr/jsx";
```

```diff
- import type { JSX } from "ovr";
+ import type * as ovr from "ovr"

- JSX.Element
+ ovr.Element
```
