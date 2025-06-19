import * as demo from "@/server/demo";
import * as esc from "@/server/escape";
import * as home from "@/server/home";
import { Layout } from "@/server/layout";
import { html } from "client:page";
import { App, csrf } from "ovr";

const app = new App();

app.base = html;
app.prerender = ["/"];

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

app.add(home, demo);

if (import.meta.env.DEV) {
	app.add(esc);
}

export default app;
