---
"ovr": major
---

refactor!: `App.base` default to `""` instead of preset html template.

BREAKING CHANGE: If the default HTML template was being used, you will now need to set it instead. The default was rarely used, in most cases you either set your own, or send partials. So this change saves you from having to set it to the empty string before sending partials.

To keep the old template default, set it after initializing the app:

```tsx
import { App } from "ovr";

const app = new App();

app.base =
	'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';
```
