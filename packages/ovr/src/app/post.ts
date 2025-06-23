import { type JSX, jsx } from "../jsx/index.js";
import { insertParams } from "../trie/insert-params.js";
import type { ButtonProps, ExtractParams, FormProps } from "../types/index.js";
import { hash } from "../util/hash.js";
import type { Middleware } from "./index.js";

export class Post<Pattern extends string = string> {
	/** Route pattern */
	pattern: Pattern;

	/** POST middleware */
	middleware: Middleware<any>[];

	/** `<button>` component with preset `formaction` and `formmethod` attributes. */
	Button: (props: ButtonProps<ExtractParams<Pattern>>) => JSX.Element;

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (props: FormProps<ExtractParams<Pattern>>) => JSX.Element;

	#parts: string[] = [];

	/**
	 * @param middleware POST middleware
	 *
	 * @example
	 *
	 * ```tsx
	 * import { Post } from "ovr";
	 *
	 * const post = new Post((c) => {
	 * 	console.log("posted");
	 * 	c.redirect("/", 303);
	 * });
	 *
	 * const page = new Get("/", () => (
	 * 	<post.Form>
	 * 		<input type="text" name="name" />
	 * 		<button>Submit</button>
	 * 	</post.Form>
	 * ));
	 *
	 * app.add(page, post); register
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
			this.pattern = `/_p/${hash(this.middleware.join())}` as Pattern;
		}

		this.#parts = this.pattern.split("/");

		this.Button = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("button", {
				formaction: insertParams(this.#parts, params),
				formmethod: "post",
				...rest,
			});
		};

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
