import * as todoContent from "@/server/demo/todo/index.md";
import { Head } from "@/ui/head";
import { Chunk, Context, Get, Post } from "ovr";
import * as z from "zod";

export const add = new Post(async () => {
	const todos = getTodos();
	const { text } = await data();
	todos.push({ id: (todos.at(-1)?.id ?? 0) + 1, text, done: false });
	redirect(todos);
});

export const toggle = new Post(async () => {
	const todos = getTodos();
	const { id } = await data();
	const current = todos.find((t) => t.id === id);
	if (current) current.done = !current.done;
	redirect(todos);
});

export const remove = new Post(async () => {
	const todos = getTodos();
	const { id } = await data();
	redirect(todos.filter((t) => t.id !== id));
});

export const todo = new Get("/demo/todo", (c) => {
	c.head(<Head {...todoContent.frontmatter} />);

	return (
		<>
			<h1>Todo</h1>

			<div class="border-muted mb-12 grid max-w-md gap-4 rounded-md border p-4">
				<add.Form search class="flex gap-4">
					<input name="text" placeholder="Add todo" />
					<button>Add</button>
				</add.Form>

				<ul class="m-0 grid list-none gap-4 p-0">
					{getTodos().map((t) => (
						<li class="m-0">
							<form class="flex justify-between">
								<input type="hidden" name="id" value={t.id} />

								<div class="flex items-center gap-4">
									<toggle.Button
										search
										class="ghost icon"
										aria-label="toggle todo"
									>
										<span
											class={
												t.done
													? "icon-[lucide--check]"
													: "icon-[lucide--square-dashed]"
											}
										/>
									</toggle.Button>

									<span>{t.text}</span>
								</div>

								<remove.Button
									search
									class="icon secondary"
									aria-label="delete todo"
								>
									<span class="icon-[lucide--x]" />
								</remove.Button>
							</form>
						</li>
					))}
				</ul>

				<todo.Anchor class="button destructive inline-flex justify-self-end">
					Reset
				</todo.Anchor>
			</div>

			<hr />

			{Chunk.safe(todoContent.html)}
		</>
	);
});

const TodoSchema = z.object({
	done: z.boolean().optional(),
	id: z.coerce.number(),
	text: z.coerce.string(),
});

const redirect = (todos: z.infer<(typeof TodoSchema)[]>) => {
	const c = Context.get();
	const location = new URL(todo.pathname(), c.url);
	location.searchParams.set("todos", JSON.stringify(todos));
	c.redirect(location, 303);
};

const getTodos = () => {
	const todos = Context.get().url.searchParams.get("todos");
	if (!todos) return [{ done: false, id: 0, text: "Build a todo app" }];
	return z.array(TodoSchema).parse(JSON.parse(todos));
};

const data = async () => {
	const data = await Context.get().req.formData();
	return TodoSchema.parse({ id: data.get("id"), text: data.get("text") });
};
