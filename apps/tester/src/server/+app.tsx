import { html } from "client:page";
import { Router, Suspense } from "ovr";

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

			<Suspense
				fallback={
					<>
						<p>Loading...</p>
						<p>Loading...</p>
					</>
				}
				after={
					<>
						<h2>After</h2>
						<h2>After 2</h2>
						<Suspense fallback={<p>Loading...</p>}>
							<Delay ms={500} />
						</Suspense>
					</>
				}
			>
				<Delay ms={1000} />
			</Suspense>
		</main>,
	),
);

export default app;
