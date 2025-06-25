import { type JSX, jsx } from "../../jsx/index.js";
import type { AnchorProps, ExtractParams } from "../../types/index.js";
import type { Middleware } from "../index.js";
import { Helper } from "./index.js";

export class Get<Pattern extends string = string> extends Helper<Pattern> {
	/** `<a>` component with preset `href` attribute. */
	Anchor: (props: AnchorProps<ExtractParams<Pattern>>) => JSX.Element;

	/**
	 * @param pattern Route pattern
	 * @param middleware GET middleware
	 *
	 * @example
	 *
	 * ```tsx
	 * import { Get } from "ovr";
	 *
	 * const page = new Get("/", () => {
	 * 	return <p>Hello world</p>
	 * });
	 *
	 * const Nav = () => {
	 * 	return <page.Anchor>Home</page.Anchor>
	 * }
	 *
	 * app.add(page); register
	 * ```
	 */
	constructor(
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		super("GET", pattern, ...middleware);

		this.Anchor = (props) => {
			const { params, ...rest } = props;

			return jsx("a", {
				href: this.pathname(
					// @ts-expect-error - do not have to pass in {} if no params
					params,
				),
				...rest,
			});
		};
	}
}
