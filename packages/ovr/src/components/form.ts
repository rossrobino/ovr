// src/lib/createPostForm.ts
import type { Middleware } from "../app/index.js";
import { hash } from "../hash/index.js";
import { jsx, type JSX } from "../jsx/index.js";

export type PostFormComponent = {
	(
		props: Omit<JSX.IntrinsicElements["form"], "action" | "method">,
	): AsyncGenerator<string, void, unknown>;
	action: string;
	handler: Middleware<unknown, {}>;
};

export const form = (handler: Middleware<unknown, {}>) => {
	const action = "/_action/" + hash(handler.toString());

	const Form = ((props) =>
		jsx("form", { ...props, action, method: "post" })) as PostFormComponent;

	Form.action = action;
	Form.handler = handler;

	return Form;
};
