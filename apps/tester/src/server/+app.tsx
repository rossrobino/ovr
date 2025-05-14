import { Component, posted } from "./action";
import { html } from "client:page";
import { App, Suspense } from "ovr";

async function* Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	yield <p>{props.ms}</p>;
}

const app = new App();

app.use(async (c, next) => {
	c.base = html;
	await next();
});

app.post(posted);

app.get("/action", (c) => c.page(<Component />));

app.get("/", (c) => {
	c.page(
		<main class="prose">
			<h1>tester</h1>

			<a href="/action">Action</a>

			<Suspense
				fallback={<p>Loading...</p>}
				children={<Delay ms={1000} />}
				after={
					<>
						<h2>After</h2>
						<Suspense fallback={<p>Loading...</p>}>
							<Delay ms={500} />
						</Suspense>
					</>
				}
			/>
		</main>,
	);
});

export default app;
