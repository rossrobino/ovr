import { Delay } from "./delay";
import * as test from "./test";
import { html } from "client:page";
import { App, Suspense } from "ovr";

const app = new App();

app.use(async (c, next) => {
	c.base = html;
	await next();
});

app.add(test);

app.get("/", () => {
	return (
		<main>
			<h1>ovr</h1>
		</main>
	);
});

export default app;
