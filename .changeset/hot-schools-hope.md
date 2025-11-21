---
"ovr": major
---

refactor(render)!: Rename `toGenerator` to `render`, move `toStream` and `toString` onto render.

```diff
- import { toGenerator, toString, toStream } from "ovr";
+ import { render } from "ovr";

- ovr.toGenerator(el);
+ ovr.render(el);

- ovr.toStream(el);
+ ovr.render.stream(el);

- ovr.toString(el);
+ ovr.render.string(el);
```
