import { html } from "client:page";
import { Router, Loading } from "ovr";

const app = new Router({
	start(c) {
		c.base = html;
	},
});

async function* Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	yield <p>{props.ms}</p>;
}

app.get("/", (c) =>
	c.page(
		<main class="prose">
			<h1>tester</h1>

			<Loading fallback={<p>Loading...</p>}>
				<Delay ms={500} />
			</Loading>

			<Loading fallback={<p>Loading...</p>}>
				<Delay ms={1000} />
			</Loading>
		</main>,
	),
);

export default app;
