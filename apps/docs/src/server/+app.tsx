import * as demo from "@/server/demo";
import * as docs from "@/server/docs";
import * as home from "@/server/home";
import { Layout } from "@/server/layout";
import { Head } from "@/ui/head";
import { chunk, html } from "client:page";
import { App, type Middleware, csrf } from "ovr";

const app = new App();

const docPrerender = docs.getSlugs().map((slug) => "/" + slug);

app.prerender = [
	home.page.pathname(),
	docs.llms.pathname(),
	...docPrerender,
	...docPrerender.map((p) => p + ".md"),
];

// preload font
const preload = chunk.src.assets.map((path) => (
	<link
		rel="preload"
		href={`/${path}`}
		as="font"
		type="font/woff2"
		crossorigin
	/>
));

const notFound: Middleware = (c) => {
	c.head.push(<Head title="Not Found" description="Content not found" />);

	return c.page(
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

app.use(
	(c, next) => {
		c.base = html;
		c.layouts.push(Layout(c));
		c.head.push(preload);
		c.notFound = notFound;
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

app.add(home, docs.page, docs.llms, demo);

export default app;
