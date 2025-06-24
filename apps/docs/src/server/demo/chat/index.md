---
title: Chat
description: Learn how to build a basic chat interface with ovr.
---

Here's a basic chat example with the OpenAI Agents SDK. The response is streamed without JavaScript using the async generator `Poet` component.

```tsx
async function* Poet(props: { message: string }) {
	const agent = new Agent({
		name: "Poet",
		instructions: "You turn messages into poems.",
		model: "gpt-4.1-nano",
	});

	const result = await run(agent, props.message, { stream: true });

	for await (const event of result) {
		if (
			event.type === "raw_model_stream_event" &&
			event.data.type === "output_text_delta"
		) {
			yield event.data.delta;
		}
	}
}
```
