import type { Middleware } from "../app/index.js";
import { hash } from "../hash/index.js";
import { jsx, type JSX } from "../jsx/index.js";

export type PostFormComponent = {
	(
		props: Omit<JSX.IntrinsicElements["form"], "action" | "method">,
	): AsyncGenerator<string, void, unknown>;
	action: string;
	middleware: Middleware<unknown, {}>[];
};

/**
 * @param middleware POST middleware handler
 * @returns `Form` component with the `action` attribute pointing to the post handler.
 * Pass directly into `app.post` to register.
 *
 * @example
 *
 * ```tsx
 * // component.tsx
 * import { form } from "ovr";
 *
 * export const Form = form((c) => {
 * 	console.log("posted");
 * 	c.redirect("/", 303);
 * });
 *
 * export const Component = () => {
 * 	return (
 * 		<Form>
 * 			<input type="text" />
 * 			<button>Submit</button>
 * 		</Form>
 * 	);
 * };
 *
 * // app.tsx
 *
 * app.post(Form)
 * ```
 */
export const form = (...middleware: Middleware<unknown, {}>[]) => {
	const action = "/_action/" + hash(middleware.toString());

	const Form = ((props) =>
		jsx("form", { ...props, action, method: "post" })) as PostFormComponent;

	Form.action = action;
	Form.middleware = middleware;

	return Form;
};
