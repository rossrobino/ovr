---
"ovr": major
---

refactor(render)!: Rename `toGenerator` to `render`, move `toStream` and `toString` onto render.

```diff
import * as ovr from "ovr";

- ovr.toGenerator(el);
+ ovr.render(el);

- ovr.toStream(el);
+ ovr.render.toStream(el);

- ovr.toString(el);
+ ovr.render.toString(el);
```
