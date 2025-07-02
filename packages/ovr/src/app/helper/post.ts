import type { ExtractParams } from "../../types/index.js";
import { hash } from "../../util/hash.js";
import type { Middleware } from "../index.js";
import { Helper } from "./index.js";

export class Post<Pattern extends string = string> extends Helper<Pattern> {
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
	 * app.add(page, post); // register
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
		let pattern: Pattern;

		if (typeof patternOrMiddleware === "string") {
			pattern = patternOrMiddleware;
		} else {
			middleware.unshift(patternOrMiddleware);
			pattern = `/_p/${hash(middleware.join())}` as Pattern;
		}

		super("POST", pattern, ...middleware);
	}
}
