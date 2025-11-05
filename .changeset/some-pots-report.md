---
"ovr": major
---

refactor(app)!: Refactor properties between `App` and `Context`.

BREAKING CHANGES:

### base

Remove `App.base` in favor of setting `Context.base` and default to `""` instead of preset html template.

If the default HTML template was being used, you will now need to set it instead. The default was rarely used, in most cases you either set your own, or send partials. So this change saves you from having to set it to the empty string before sending partials making it easier for HTMX users for example.

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

Trailing slash preference is now set in the `App` config instead of a property.

```diff
+ new App({ trailingSlash: "always" })
- app.trailingSlash = "always"
```

### notFound

Custom `notFound` handler is now set exclusively within `Context`, not on the `App`.

```diff
const app = new App();

const notFound = (c) => {
	// ...
};

- app.notFound = notFound;
+ app.use((c, next) => {
+	c.notFound = notFound;
+	return next();
+ });
```

### error

`error` has been removed in favor of using user middleware instead.

```diff
const app = new App();

const errorHandler = (c, error) => {
	// ...
};

- app.error = errorHandler;
+ app.use(async (c, next) => {
+ 	try {
+		await next();
+	} catch (error) {
+		errorHandler(c, error);
+	}
+ });
```
