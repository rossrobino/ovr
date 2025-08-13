---
title: Chat
description: Learn how to build a basic chat interface with ovr.
---

Here's a chat example with the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses). The response is streamed _without_ client-side JavaScript using the async generator `Poet` component.

```tsx
import { OpenAI } from "openai";

const client = new OpenAI();

async function* Poet(props: { message: string }) {
	const response = await client.responses.create({
		input: props.message,
		instructions: "You turn messages into poems.",
		model: "gpt-5-nano",
		reasoning: { effort: "minimal" },
		text: { verbosity: "low" },
		stream: true,
	});

	for await (const event of response) {
		if (event.type === "response.output_text.delta") yield event.delta;
	}
}
```
