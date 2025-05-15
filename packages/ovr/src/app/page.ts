import { jsx, type JSX } from "../jsx/index.js";
import type { ExtractParams, Middleware, Params } from "./index.js";

type LinkProps<P extends Params> = Omit<JSX.IntrinsicElements["a"], "href"> &
	(keyof P extends never ? { params?: never } : { params: P });

export class Page<Pattern extends string = string> {
	id: string;
	middleware: Middleware<any>[];

	/** `<a>` component with preset `href` attribute. */
	Link: (
		props: LinkProps<ExtractParams<Pattern>>,
	) => AsyncGenerator<string, void, unknown>;

	#parts: string[];

	/**
	 * @param id route pattern
	 * @param middleware GET middleware handler
	 *
	 * @example
	 *
	 * ```tsx
	 * // page.tsx
	 * import { Page } from "ovr";
	 *
	 * export const page = new Page("/", () => {
	 * 	return <p>Hello world.</p>
	 * });
	 *
	 * const Nav = () => {
	 * 	return <page.Link>Link</page.Link>
	 * }
	 *
	 * // app.tsx
	 * app.get(page); registers the page
	 * ```
	 */
	constructor(
		id: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		this.id = id;
		this.middleware = middleware;
		this.#parts = id.split("/");
		this.Link = (props) => {
			const { params = {}, ...rest } = props;

			return jsx("a", {
				...rest,
				href: this.#insertParams(this.#parts, params),
			});
		};
	}

	#insertParams(parts: string[], params: Params): string {
		return parts
			.map((part) => {
				if (part.startsWith(":")) {
					const param = part.slice(1);
					if (!(param in params))
						throw new Error(
							`Parameter "${param}" did not match pattern "${this.id}".`,
						);
					return params[param as keyof typeof params];
				}

				if (part === "*") {
					if (!("*" in params)) throw new Error("No wildcard parameter found.");
					return params["*"];
				}

				return part;
			})
			.join("/");
	}
}
