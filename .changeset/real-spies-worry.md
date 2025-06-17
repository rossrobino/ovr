---
"ovr": major
---

feat: Escape content and attributes automatically.

This fixes one of the major shortcomings of ovr, previously it did not automatically escape content or attribute strings. Now ovr will automatically escape any children and attribute content.

`jsx` and `toGenerator` now are `AsyncGenerator<Chunk>` instead of `AsyncGenerator<string>`. When a `Chunk` is created, its `value` is escaped by default.

Now, to render HTML directly without escaping, create a new `Chunk` with the second argument `safe` set to `true`.

```tsx
import { Chunk } from "ovr";

const html = "<p>Safe to render</p>";

function Component() {
	return <div>{new Chunk(html, true)}</div>;
}
```
