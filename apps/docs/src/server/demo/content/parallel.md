---
title: Parallelization
description: Understand how ovr processes async components in parallel.
---

# Parallelization

This is a demo of a streamed HTML page, each `Delay` component is delayed a certain number of milliseconds. There is no client side JavaScript, the HTML is simply streamed _in order_ as it is generated. Many frameworks by default wait until the last `Delay` component has finished rendering before sending the final response, then the entire HTML page is sent at once. Finally, your browser can request the other linked assets, then render the page. In most frameworks, you must _opt in_ to streaming.

With ovr, you have fine grained control of when each chunk of HTML arrives. By default, every component is streamed independently. You can read this content immediately instead of waiting 2 seconds for the last component to render. The delay does not waterfall, components are generated in parallel with `Promise.race`, each arrives 200ms after the next instead of the total delay.

```tsx
const Delay = async ({ ms }: { ms: number }) => {
	await new Promise((res) => setTimeout(res, ms));
	return <div class="bg-muted rounded-md p-2">{ms}ms</div>;
};

const Delays = () => {
	const delays = Array.from({ length: 6 }, (_, i) => i * 200);
	return delays.map((ms) => <Delay ms={ms} />);
};
```
