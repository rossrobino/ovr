import * as demo from "./demo";
import * as home from "./home";
import { html } from "client:page";
import { App } from "ovr";

const app = new App();

app.base = html;
app.prerender = ["/"];

app.add(home, demo);

export default app;
