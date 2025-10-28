import * as chatContent from "@/server/demo/chat/index.md";
import { Head } from "@/ui/head";
import "dotenv/config";
import { Chunk, Get, Post } from "ovr";
import * as z from "zod";

async function* Poet(props: { message: string }) {
	const { OpenAI } = await import("openai");
	const client = new OpenAI();

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

export const chat = new Get("/demo/chat", (c) => {
	c.head(<Head {...chatContent.frontmatter} />);

	return (
		<div>
			<h1>{chatContent.frontmatter.title}</h1>

			{Chunk.safe(chatContent.html)}

			<hr />

			<stream.Form class="bg-muted border-secondary grid max-w-sm gap-4 rounded-md border p-4">
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

			<div class="flex flex-col-reverse">
				<chat.Anchor>Back to chat</chat.Anchor>

				<blockquote class="bg-muted rounded-md p-6 shadow-md">
					<Poet message={message} />
				</blockquote>
			</div>
		</div>
	);
});
