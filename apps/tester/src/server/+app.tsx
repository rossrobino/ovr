import { html } from "client:page";
import { Router, type JSX } from "ovr";

const app = new Router({
	start(c) {
		c.base = html;
	},
});

const Loading = (props: { children: JSX.Element; fallback: JSX.Element }) => {
	return (
		<>
			<style>
				{".ovr-f{display:contents;&:has(+ *:not(:empty)){display:none}}"}
			</style>
			<div class="ovr-f">{props.fallback}</div>
			<div style="display:contents">{props.children}</div>
		</>
	);
};

const Delay = async (props: { ms: number }) => {
	await new Promise((res) => setTimeout(res, props.ms));
	return props.ms;
};

app.get("/", (c) =>
	c.page(
		<main class="prose">
			<h1>tester</h1>

			<Loading fallback={<p>Loading...</p>}>
				<Delay ms={1000} />
			</Loading>
		</main>,
	),
);

export default app;
