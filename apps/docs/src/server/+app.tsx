import * as demo from "@/server/demo";
import * as docs from "@/server/docs";
import * as home from "@/server/home";
import { Layout } from "@/server/layout";
import { html } from "client:page";
import { App, csrf } from "ovr";

const app = new App();

app.base = html;

app.prerender = [
	home.page.pathname(),
	...docs.getSlugs().map((slug) => "/" + slug),
];

app.use(
	(c, next) => {
		c.layout(Layout);
		return next();
	},
	csrf({
		origin: import.meta.env.DEV
			? "http://localhost:5173"
			: "https://ovr.robino.dev",
	}),
);

if (import.meta.env.DEV) {
	app.get("/backpressure", async (c) => {
		// need to make each chunk very large to observe pull stop
		// log something in the Context.page => pull method to see
		const res = await fetch("http://localhost:5173/demo/memory");

		// Manually consume the stream slowly
		const reader = res.body!.getReader();

		while (true) {
			// Only read every 100ms to simulate slow client
			await new Promise((resolve) => setTimeout(resolve, 100));
			const { done, value } = await reader.read();
			console.log(`Read ${value?.length} bytes`);
			if (done) break;
		}

		return c.res("done");
	});
}

app.add(home, docs.page, demo);

export default app;
