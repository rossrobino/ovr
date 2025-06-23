import { processor } from "@/lib/md";
import code from "@/server/demo/chat?raw";
import { Agent, run } from "@openai/agents";
import "dotenv/config";
import { Chunk, Get, Post, csrf } from "ovr";
import * as z from "zod/v4";

export const chat = new Get("/demo/chat", () => {
	const codeBlock = new Chunk(
		processor.render(`\`\`\`tsx\n${code}\`\`\``),
		true,
	);

	return (
		<div>
			<h1>Chat</h1>

			<p>
				Here's a basic chat example with the OpenAI Agents SDK. The response is
				streamed without JavaScript using the async generator
				<code>Poet</code> component.
			</p>

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

			<hr />

			{codeBlock}
		</div>
	);
});

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

export const stream = new Post(
	csrf({
		origin: import.meta.env.DEV
			? "http://localhost:5173"
			: "https://ovr.robino.dev",
	}),
	async (c) => {
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
	},
);
