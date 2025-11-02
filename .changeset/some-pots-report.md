---
"ovr": major
---

refactor(app)!: Refactor properties on `App` and `Context`.

BREAKING CHANGES:

### base

Move `App.base` to `Context.base` and default to `""` instead of preset html template.

If the default HTML template was being used, you will now need to set it instead. The default was rarely used, in most cases you either set your own, or send partials. So this change saves you from having to set it to the empty string before sending partials.

To keep the old template default, set it within middleware:

```tsx
import { App } from "ovr";

const app = new App();

app.use((c, next) => {
	c.base =
		'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';

	return next();
});
```

### trailingSlash

### notFound

### error
