import * as home from "./home";
import * as test from "./test";
import { html } from "client:page";
import { App } from "ovr";

const app = new App();

app.base = html;

app.add(home, test);

export default app;
