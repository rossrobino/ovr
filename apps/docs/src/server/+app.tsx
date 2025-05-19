import * as home from "./home";
import * as test from "./test";
import { html } from "client:page";
import { App } from "ovr";

console.log("top level");

const app = new App();

app.use(async (c, next) => {
	console.log("use");
	c.base = html;
	await next();
});

app.add(home, test);

app.prerender = [];

export default app;
