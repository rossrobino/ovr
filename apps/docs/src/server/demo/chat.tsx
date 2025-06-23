import * as chatContent from "@/server/demo/content/chat.md";
import { Head } from "@/ui/head";
import "dotenv/config";
import { Chunk, Get, Post } from "ovr";
import * as z from "zod/v4-mini";

async function* Poet(props: { message: string }) {
	const { Agent, run } = await import("@openai/agents");

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

export const chat = new Get("/demo/chat", (c) => {
	c.head(<Head {...chatContent.frontmatter} />);

	return (
		<div>
			<h1>{chatContent.frontmatter.title}</h1>

			{new Chunk(chatContent.html, true)}

			<hr />

			<stream.Form class="grid gap-4">
				<div>
					<label for="message">Message</label>
					<textarea
						name="message"
						id="message"
						placeholder="Create a poem from a message"
					></textarea>
				</div>
				<button>Send</button>
			</stream.Form>
		</div>
	);
});

export const stream = new Post(async (c) => {
	const data = await c.req.formData();
	const message = z.string().parse(data.get("message"));

	return (
		<div>
			<h1>Poem</h1>

			<blockquote class="bg-muted rounded-md p-6 shadow-md">
				<Poet message={message} />
			</blockquote>

			<chat.Anchor>Back to chat</chat.Anchor>
		</div>
	);
});
