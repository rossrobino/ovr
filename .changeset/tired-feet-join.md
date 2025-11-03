---
"ovr": major
---

refactor(app)!: Move to web standard APIs.

ovr now runs more reliably in non-NodeJS runtimes. Removes reliance on `node:` built-in APIs, specifically `async_hooks` created various issues across platforms.

BREAKING CHANGES:

### Generator type

Synchronous generators are now distinguished from other iterables by checking if they have a `next` property, instead of `util.types.isGeneratorObject`.

### Async Local Storage removal

- Without Async Local Storage, the `search` option within `Helper.url` and the `search` component prop no longer can take `true` as a value. You must pass in `Context.url.search` manually.
- `Context.get` has been removed. You can easily implement the feature if needed, see below.

```tsx
import { AsyncLocalStorage } from "node:async_hooks";
import { App, type Context } from "ovr";

const app = new App();

const storage = new AsyncLocalStorage<Context>();

/**
 * Call within the scope of a handler to get the current context.
 *
 * @returns `Request` context
 */
const getContext = () => {
	const c = App.storage.getStore();

	if (!c)
		throw new ReferenceError("Context can only be obtained within a handler.");

	return c;
};

app.get("/", (c) => {
	return storage.run(c, async () => {
		return <Component />;
	});
});

const Component = () => {
	const c = getContext();
	return <div>{c.url.pathname}</div>;
};
```
