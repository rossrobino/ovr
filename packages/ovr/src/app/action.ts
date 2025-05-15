import { hash } from "../hash/index.js";
import { jsx, type JSX } from "../jsx/index.js";
import type { Middleware } from "./index.js";

type FormProps = Omit<JSX.IntrinsicElements["form"], "action" | "method">;

export class Action {
	id: string;
	middleware: Middleware<{}>[];

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (props: FormProps) => AsyncGenerator<string, void, unknown>;

	/**
	 * @param middleware POST middleware handler
	 *
	 * @example
	 *
	 * ```tsx
	 * // action.tsx
	 * import { Action } from "ovr";
	 *
	 * export const action = new Action((c) => {
	 * 	console.log("posted");
	 * 	c.redirect("/", 303);
	 * });
	 *
	 * export const Component = () => (
	 * 	<action.Form>
	 * 		<input />
	 * 		<button>Submit</button>
	 * 	</action.Form>
	 * );
	 *
	 * // app.tsx
	 * app.post(action); registers the action
	 * ```
	 */
	constructor(...middleware: Middleware<{}>[]) {
		this.id = `/_action/${hash(middleware.join())}`;
		this.middleware = middleware;
		this.Form = (props) =>
			jsx("form", { ...props, action: this.id, method: "post" });
	}
}
