---
title: Todo
description: A basic todo app built with ovr.
---

A server driven todo app that stores data in the URL.

```tsx
import { Chunk, Context, Get, Post } from "ovr";
import * as z from "zod";

export const add = new Post(async (c) => {
	const todos = getTodos(c);
	const { text } = await data(c);
	todos.push({ id: (todos.at(-1)?.id ?? 0) + 1, text, done: false });
	redirect(c, todos);
});

export const toggle = new Post(async (c) => {
	const todos = getTodos(c);
	const { id } = await data(c);
	const current = todos.find((t) => t.id === id);
	if (current) current.done = !current.done;
	redirect(c, todos);
});

export const remove = new Post(async (c) => {
	const todos = getTodos(c);
	const { id } = await data(c);
	redirect(
		c,
		todos.filter((t) => t.id !== id),
	);
});

export const todo = new Get("/demo/todo", (c) => {
	c.head(<Head {...todoContent.frontmatter} />);

	return (
		<>
			<h1>Todo</h1>

			<div>
				<add.Form search={c.url.search}>
					<input name="text" placeholder="Add todo" />
					<button>Add</button>
				</add.Form>

				<ul>
					{getTodos(c).map((t) => (
						<li class="m-0">
							<form>
								<input type="hidden" name="id" value={t.id} />

								<div>
									<toggle.Button search={c.url.search} aria-label="toggle todo">
										{t.done ? "done" : "todo"}
									</toggle.Button>

									<span>{t.text}</span>
								</div>

								<remove.Button search={c.url.search} aria-label="delete todo">
									x
								</remove.Button>
							</form>
						</li>
					))}
				</ul>

				<todo.Anchor>Reset</todo.Anchor>
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

const redirect = (c: Context, todos: z.infer<(typeof TodoSchema)[]>) => {
	const location = new URL(todo.pathname(), c.url);
	location.searchParams.set("todos", JSON.stringify(todos));
	c.redirect(location, 303);
};

const getTodos = (c: Context) => {
	const todos = c.url.searchParams.get("todos");
	if (!todos) return [{ done: false, id: 0, text: "Build a todo app" }];
	return z.array(TodoSchema).parse(JSON.parse(todos));
};

const data = async (c: Context) => {
	const data = await c.req.formData();
	return TodoSchema.parse({ id: data.get("id"), text: data.get("text") });
};
```
