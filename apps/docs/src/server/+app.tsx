import * as demo from "@/server/demo";
import * as docs from "@/server/docs";
import * as home from "@/server/home";
import { Layout } from "@/server/layout";
import { FavIcon } from "@/ui/favicon";
import { FontPreload } from "@/ui/font-preload";
import { Head } from "@/ui/head";
import { html } from "client:page";
import { App, type Middleware } from "ovr";

const app = new App();

const notFound: Middleware = (c) => {
	c.head.push(<Head title="Not Found" description="Content not found" />);

	c.page(
		<>
			<h1>Not Found</h1>

			<p>
				<button
					type="button"
					class="mb-6 cursor-pointer"
					onclick="history.back()"
				>
					Back
				</button>

				<a href="/">Return home</a>
			</p>
		</>,
		404,
	);
};

app.use(async (c, next) => {
	c.base = html;
	c.layouts.push(Layout(c));
	c.head.push(<FontPreload />, <FavIcon />);
	c.notFound = notFound;
	await next();
});

if (import.meta.env.DEV) {
	app.get("/backpressure", async (c) => {
		// need to make each chunk is very large to observe pull stop
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

		c.res("done");
	});
}

app.add(home, docs.page, docs.llms, demo);

const docPrerender = docs.getSlugs().map((slug) => "/" + slug);

export default {
	fetch: app.fetch,
	prerender: [
		home.page.pathname(),
		docs.llms.pathname(),
		...docPrerender,
		...docPrerender.map((p) => p + ".md"),
	],
};
