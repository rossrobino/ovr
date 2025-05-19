import { jsx, type JSX } from "../jsx/index.js";
import { insertParams } from "../trie/insert-params.js";
import type { ExtractParams } from "../types/index.js";
import type { Middleware, Params } from "./index.js";

type AnchorProps<P extends Params> = Omit<JSX.IntrinsicElements["a"], "href"> &
	(keyof P extends never ? { params?: never } : { params: P });

export class Page<Pattern extends string = string> {
	/** Route pattern */
	pattern: Pattern;

	/** GET middleware */
	middleware: Middleware<any>[];

	/** `<a>` component with preset `href` attribute. */
	Anchor: (
		props: AnchorProps<ExtractParams<Pattern>>,
	) => AsyncGenerator<string, void, unknown>;

	#parts: string[];

	/**
	 * @param pattern Route pattern
	 * @param middleware GET middleware
	 *
	 * @example
	 *
	 * ```tsx
	 * // page.tsx
	 * import { Page } from "ovr";
	 *
	 * export const page = new Page("/", () => {
	 * 	return <p>Hello world</p>
	 * });
	 *
	 * const Nav = () => {
	 * 	return <page.Anchor>Home</page.Anchor>
	 * }
	 *
	 * // app.tsx
	 * app.add(page); registers the page
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
	}
}
