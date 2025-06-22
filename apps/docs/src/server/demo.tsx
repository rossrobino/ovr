import { Get } from "ovr";

async function Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	return <div class="delay">{props.ms}ms</div>;
}

export const page = new Get("/demo", (c) => {
	c.head(<title>Demo</title>);

	const delays = Array.from({ length: 11 }, (_, i) => i * 200);

	return (
		<>
			<h1>Demo</h1>
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
				With ovr, you have fine grained control of when each chunk of HTML
				arrives. By default, every component is streamed independently. You can
				read this content immediately instead of waiting 2 seconds for the last
				component to render.
			</p>
			<p>
				The delay does not waterfall, components are generated in parallel with{" "}
				<code>Promise.race</code>, each arrives 200ms after the next instead of
				the total delay.
			</p>

			<page.Anchor class="button ghost gap-3">
				<span class="icon-[lucide--rotate-cw]"></span> Refresh
			</page.Anchor>

			{[...delays, 1000].map((ms) => (
				<Delay ms={ms} />
			))}
		</>
	);
});
