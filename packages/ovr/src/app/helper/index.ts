import { type JSX, jsx } from "../../jsx/index.js";
import type {
	ButtonProps,
	ExtractParams,
	FormProps,
	InsertParams,
} from "../../types/index.js";
import type { Middleware } from "../index.js";

export class Helper<Pattern extends string> {
	/** Extracted parameters type for the pattern */
	declare readonly Params: ExtractParams<Pattern>;

	/** Route pattern */
	pattern: Pattern;

	/** GET middleware */
	middleware: Middleware<any>[]; // any so you can use other middleware

	/** `<button>` component with preset `formaction` and `formmethod` attributes. */
	Button: (props: ButtonProps<ExtractParams<Pattern>>) => JSX.Element;

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (props: FormProps<ExtractParams<Pattern>>) => JSX.Element;

	/** Pattern parts */
	#parts: string[];

	constructor(
		method: string,
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		this.pattern = pattern;
		this.middleware = middleware;
		this.#parts = pattern.split("/");

		this.Button = (props) => {
			const { params, ...rest } = props;

			return jsx("button", {
				formaction: this.pathname(
					// @ts-expect-error - do not have to pass in {} if no params
					params,
				),
				formmethod: method,
				...rest,
			});
		};

		this.Form = (props) => {
			const { params, ...rest } = props;

			return jsx("form", {
				action: this.pathname(
					// @ts-expect-error - do not have to pass in {} if no params
					params,
				),
				method,
				...rest,
			});
		};
	}

	/**
	 * @param [params] Parameters to insert
	 * @returns Resolved `pathname` with params
	 */
	pathname<Params extends ExtractParams<Pattern>>(
		...[params]: keyof Params extends never ? [] : [Params]
	): InsertParams<Pattern, Params> {
		if (!params) return this.pattern as InsertParams<Pattern, Params>;

		const wild = "*";

		return this.#parts
			.map((part) => {
				if (part.startsWith(":")) {
					const param = part.slice(1);

					if (!(param in params))
						throw new Error(`Parameter "${param}" did not match pattern.`);

					return params[param as keyof typeof params];
				}

				if (part === wild) {
					if (!(wild in params))
						throw new Error("No wildcard parameter found.");

					return params[wild];
				}

				return part;
			})
			.join("/") as InsertParams<Pattern, Params>;
	}
}
