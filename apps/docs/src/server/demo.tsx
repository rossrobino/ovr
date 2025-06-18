import * as home from "./home";
import { Action, Page } from "ovr";

async function Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	return <div class="delay">{props.ms}ms</div>;
}

export const page = new Page("/demo", (c) => {
	c.head(<title>Demo</title>);

	const delays = Array.from({ length: 11 }, (_, i) => i * 200);

	return (
		<main>
			<h1>Demo</h1>
			<p>
				<home.page.Anchor>Docs</home.page.Anchor>
				{" | "}
				<actionPage.Anchor params={{ param: "param" }}>
					Action
				</actionPage.Anchor>
			</p>
			<p>
				This is a demo of a streamed HTML page, each <code>Delay</code>{" "}
				component is delayed a certain number of milliseconds. There is no
				client side JavaScript, the HTML is simply streamed <i>in order</i> as
				it is generated.
			</p>
			<p>
				Many frameworks by default wait until the last <code>Delay</code>{" "}
				component has finished rendering before sending the final response, then
				the entire HTML page is sent at once. Finally, your browser can request
				the other linked assets, then render the page.
			</p>
			<p>
				With ovr, you have fine grained control of when each piece of HTML
				arrives. By default, every component is streamed independently. You can
				read this content immediately instead of waiting 2 seconds for the last
				component to render.
			</p>
			<p>
				The delay does not waterfall, components are generated in parallel with{" "}
				<code>Promise.race</code>, each arrives 200ms after the next instead of
				the total delay.
			</p>

			{[...delays, 1000].map((ms) => (
				<Delay ms={ms} />
			))}
		</main>
	);
});

export const action = new Action((c) => {
	console.log("posted");

	c.redirect(page.pattern);
});

export const actionPage = new Page("/demo/action/:param", (c) => {
	c.head(<title>ovr action</title>);

	return (
		<main>
			<h1>Action</h1>
			<p>
				This page is a demo of the{" "}
				<code>
					<a href="/#action">Action</a>
				</code>{" "}
				helper.
			</p>
			<action.Form>
				<input />
				<button>Submit</button>
			</action.Form>
		</main>
	);
});
