import * as demo from "@/server/demo";
import * as docs from "@/server/docs";
import * as home from "@/server/home";
import { Layout } from "@/server/layout";
import { html } from "client:page";
import { App, csrf } from "ovr";

const app = new App();

app.base = html;

app.prerender = [
	home.page.pattern,
	...docs.getSlugs().map((slug) => "/" + slug),
];

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

app.add(home, docs.page, demo);

export default app;
