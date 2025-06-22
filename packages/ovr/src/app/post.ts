import { type JSX, jsx } from "../jsx/index.js";
import { insertParams } from "../trie/insert-params.js";
import type { ExtractParams } from "../types/index.js";
import { hash } from "../util/hash.js";
import type { Middleware, Params } from "./index.js";

type FormProps<P extends Params> = JSX.IntrinsicElements["form"] &
	(keyof P extends never ? { params?: never } : { params: P });

export class Post<Pattern extends string = string> {
	/** Route pattern */
	pattern: Pattern;

	/** POST middleware */
	middleware: Middleware<any>[];

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
	 * 		<input />
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
