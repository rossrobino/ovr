---
title: Progressive HTML Rendering
description: Introduction to ovr.
---

ovr is a [lightweight](https://npmgraph.js.org/?q=ovr) server framework built for streaming HTML with asynchronous JSX and a modern Fetch API-based router.

## Introduction

Designed to optimize performance and Time-To-First-Byte (TTFB), ovr evaluates components in parallel and streams HTML in order by producing an `AsyncGenerator` of HTML that feeds directly into the streamed response.

```tsx
function Component() {
	return <p>hello world</p>;
}
```

For the component above, ovr generates three chunks of HTML:

```ts
"<p>"; // streamed immediately
"hello world"; // next
"</p>"; // last
```

While this is trivial for a paragraph, consider when a component is asynchronous:

```tsx
async function Username() {
	const user = await getUser(); // slow...
	return <span>{user.name}</span>;
}

function Component() {
	return (
		<p>
			hello <Username />
		</p>
	);
}
```

Instead of waiting for `getUser` to resolve before sending the entire component, ovr will send what it has immediately and stream the rest as it becomes available.

```ts
"<p>";
"hello "; // before getUser() resolves
// await getUser()...
"<span>";
"username";
"</span>";
"</p>";
```

Web browsers are built for streaming, they parse and paint HTML as it arrives. Most critically, the `<head>` of the document can be sent immediately to start the requests for linked assets (JavaScript, CSS, etc.) before the page has finished rendering.

<video aria-label="A video showing the network waterfall of a website loading. The HTML head element is streamed immediately, allowing JavaScript and CSS files to download while the rest of the HTML body streams in simultaneously." src="https://zsbsjhwuth2a2ck8.public.blob.vercel-storage.com/html-streaming-network-Owka5ZckQQIo791h0LQ771O5ZZV3Wb.mp4" autoplay loop muted loading="lazy" playsinline></video>

ovr's architecture gives you true streaming SSR and progressive rendering out of the box. No hydration bundle, no buffering---just HTML delivered in order, as soon as it's ready.
