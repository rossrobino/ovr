import { html } from "client:page";
import { Router } from "ovr";

const app = new Router({
	start(c) {
		c.base = html;
	},
});

app.get("/", (c) =>
	c.page(
		<main class="prose">
			<h1>tester</h1>
			<input type="text"></input>
			<hr />
			<progress></progress>
			<img src="" alt="" />
			<ul>
				<li>
					<a href="https://vitejs.dev">Vite</a>
				</li>
				<li>
					<a href="https://domco.robino.dev">domco</a>
				</li>
			</ul>
		</main>,
	),
);

export default app;
