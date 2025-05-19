import * as home from "./home";
import * as test from "./test";
import { html } from "client:page";
import { App } from "ovr";

const app = new App();

app.use(async (c, next) => {
	c.base = html;
	await next();
});

app.add(home, test);

export default app;
