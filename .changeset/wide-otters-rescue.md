---
"ovr": major
---

refactor(app)!: Merge `App.add` and `App.on/get/post` with `App.use`.

`use` is now the single way to add middleware and routes to an app.

```ts
import * as ovr from "ovr";

const app = new ovr.App();

const mw: ovr.Middleware = (c, next) => {
	console.log(c.req.method);
	return next();
};

const route = ovr.Route.get("/", () => "hello world");

app.use(mw, route);
```
