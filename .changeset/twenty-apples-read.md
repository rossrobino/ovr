---
"ovr": minor
---

feat: Adds the `true` option to the `search` option in `Helper.url` and component props to forward the current requests search params.

```tsx
import { Get } from "ovr";

const page = new Get("/", () => {
	// `search={true}` forwards the search params to the `href` attribute
	return <page.Anchor search>Home</page.Anchor>;
});
```
