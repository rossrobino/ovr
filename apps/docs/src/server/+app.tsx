import * as demo from "@/server/demo";
import * as esc from "@/server/escape";
import * as home from "@/server/home";
import { html } from "client:page";
import { App } from "ovr";

const app = new App();

app.base = html;
app.prerender = ["/"];

app.add(home, demo);

if (import.meta.env.DEV) {
	app.add(esc);
}

export default app;
