import { hash } from "../hash/index.js";
import { jsx, type JSX } from "../jsx/index.js";
import { insertParams } from "../trie/insert-params.js";
import type { ExtractParams } from "../types/index.js";
import type { Middleware, Params } from "./index.js";

type FormProps<P extends Params> = Omit<
	JSX.IntrinsicElements["form"],
	"action" | "method"
> &
	(keyof P extends never ? { params?: never } : { params: P });

export class Action<Pattern extends string = string> {
	/** Route pattern */
	pattern: Pattern;

	/** POST middleware */
	middleware: Middleware<any>[];

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (
		props: FormProps<ExtractParams<Pattern>>,
	) => AsyncGenerator<string, void, unknown>;

	#parts: string[] = [];

	/**
	 * @param middleware POST middleware
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
	 * export const page = new Page("/", () => (
	 * 	<action.Form>
	 * 		<input />
	 * 		<button>Submit</button>
	 * 	</action.Form>
	 * ));
	 *
	 * // app.tsx
	 * app.add(page, action); registers the action
	 * ```
	 */
	constructor(...middleware: Middleware<{}>[]);
	/**
	 * @param pattern Route pattern
	 * @param middleware POST middleware
	 */
	constructor(
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	);
	constructor(
		patternOrMiddleware: Pattern | Middleware<ExtractParams<Pattern>>,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		this.middleware = middleware;

		if (typeof patternOrMiddleware === "string") {
			this.pattern = patternOrMiddleware;
		} else {
			this.middleware.unshift(patternOrMiddleware);
			this.pattern = `/_action/${hash(this.middleware.join())}` as Pattern;
		}

		this.#parts = this.pattern.split("/");

		this.Form = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("form", {
				action: insertParams(this.#parts, params),
				method: "post",
				...rest,
			});
		};
	}
}
