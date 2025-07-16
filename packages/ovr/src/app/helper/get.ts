import { type JSX, jsx } from "../../jsx/index.js";
import type { ExtractParams } from "../../types/index.js";
import type { Middleware } from "../index.js";
import { Helper, type HelperComponentProps } from "./index.js";

export class Get<Pattern extends string = string> extends Helper<Pattern> {
	/** `<a>` component with preset `href` attribute. */
	Anchor: (
		props: JSX.IntrinsicElements["a"] &
			HelperComponentProps<ExtractParams<Pattern>>,
	) => JSX.Element;

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
	 * app.add(page); // register
	 * ```
	 */
	constructor(
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		super("GET", pattern, ...middleware);

		this.Anchor = ({ params, search, hash, ...rest }) =>
			jsx("a", {
				href: this.url({ params, search, hash } as HelperComponentProps<
					ExtractParams<Pattern>
				>),
				...rest,
			});
	}
}
