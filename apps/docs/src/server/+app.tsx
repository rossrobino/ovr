import * as demo from "@/server/demo";
import * as docs from "@/server/docs";
import * as home from "@/server/home";
import { createLayout } from "@/server/layout";
import { Meta } from "@/ui/meta";
import * as o from "ovr";

const app = new o.App();

const notFound: o.Middleware = (c) => {
	const Layout = createLayout(c);

	c.html(
		o.render.stream(
			<Layout head={<Meta title="Not Found" description="Content not found" />}>
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
			</Layout>,
		),
		404,
	);
};

app.use(
	(c, next) => {
		c.notFound = notFound;
		return next();
	},
	home,
	docs.page,
	docs.llms,
	demo,
);

if (import.meta.env.DEV) {
	const backpressure = o.Route.get("/backpressure", async (c) => {
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

		c.text("done");
	});

	app.use(backpressure);
}

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
