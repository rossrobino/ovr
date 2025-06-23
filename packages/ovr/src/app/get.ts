import { type JSX, jsx } from "../jsx/index.js";
import { insertParams } from "../trie/insert-params.js";
import type {
	AnchorProps,
	ButtonProps,
	ExtractParams,
	FormProps,
} from "../types/index.js";
import type { Middleware } from "./index.js";

export class Get<Pattern extends string = string> {
	/** Route pattern */
	pattern: Pattern;

	/** GET middleware */
	middleware: Middleware<any>[];

	/** `<a>` component with preset `href` attribute. */
	Anchor: (props: AnchorProps<ExtractParams<Pattern>>) => JSX.Element;

	/** `<button>` component with preset `formaction` and `formmethod` attributes. */
	Button: (props: ButtonProps<ExtractParams<Pattern>>) => JSX.Element;

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (props: FormProps<ExtractParams<Pattern>>) => JSX.Element;

	#parts: string[];

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
		this.pattern = pattern;
		this.middleware = middleware;
		this.#parts = pattern.split("/");

		this.Anchor = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("a", { href: insertParams(this.#parts, params), ...rest });
		};

		this.Button = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("button", {
				formaction: insertParams(this.#parts, params),
				formmethod: "get",
				...rest,
			});
		};

		this.Form = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("form", {
				action: insertParams(this.#parts, params),
				...rest,
			});
		};
	}
}
