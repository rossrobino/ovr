import * as test from "./test";
import { html as docsHtml, headings } from "@/content/docs.md";
import { html } from "client:page";
import { App, Suspense } from "ovr";

const delay = () => new Promise((r) => setTimeout(r, 500));

const app = new App();

app.use(async (c, next) => {
	c.base = html;
	await next();
});

app.get("/", () => {
	return (
		<main>
			<Suspense
				children={async function* () {
					yield "<h1>o";
					await delay();
					yield "v";
					await delay();
					yield "r</h1>";
				}}
				after={docsHtml}
			/>
		</main>
	);
});

app.add(test);

export default app;
