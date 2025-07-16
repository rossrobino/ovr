---
title: Todo
description: A basic todo app built with ovr.
---

A server driven todo app that stores data in the URL.

```tsx
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
	return (
		<div>
			<add.Form search={c.url.search}>
				<input name="text" placeholder="Add todo" />
				<button>Add</button>
			</add.Form>

			<ul>
				{getTodos().map((t) => (
					<li>
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
```
