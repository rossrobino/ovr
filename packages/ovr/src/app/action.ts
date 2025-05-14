import { hash } from "../hash/index.js";
import { jsx, type JSX } from "../jsx/index.js";
import type { Middleware } from "./index.js";

export type Action = {
	/** Action pathname id. */
	id: string;

	/** POST middleware to run when action is called. */
	middleware: Middleware<{}>[];

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (
		props: Omit<JSX.IntrinsicElements["form"], "action" | "method">,
	) => AsyncGenerator<string, void, unknown>;
};

/**
 * @param middleware POST middleware handler
 * @returns `Action` - pass directly into `app.post` to register.
 *
 * @example
 *
 * ```tsx
 * // action.tsx
 * import { action } from "ovr";
 *
 * export const posted = action((c) => {
 * 	console.log("posted");
 * 	c.redirect("/", 303);
 * });
 *
 * export const Component = () => {
 * 	return (
 * 		<posted.Form>
 * 			<input />
 * 			<button>Submit</button>
 * 		</posted.Form>
 * 	);
 * };
 *
 * // app.tsx
 * app.post(posted)
 * ```
 */
export const action = (...middleware: Middleware<{}>[]): Action => {
	const id = `/_action/${hash(middleware.join())}`;

	return {
		id,
		Form: (props) => jsx("form", { ...props, action: id, method: "post" }),
		middleware,
	};
};
