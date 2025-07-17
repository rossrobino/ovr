import { type JSX, jsx } from "../../jsx/index.js";
import type { Params } from "../../trie/index.js";
import type { ExtractParams, InsertParams } from "../../types/index.js";
import { Context } from "../context.js";
import type { Middleware } from "../index.js";

export type UrlOptions<P extends Params> = {
	/**
	 * If `true` the current request's `url.search` is forwarded, this option
	 * can only be used in the context of a request.
	 *
	 * Otherwise the value is passed into `URLSearchParams` constructor to
	 * create new params.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
	 */
	search?:
		| boolean
		| string
		// Iterable is more accurate than the built in string[][] + URLSearchParams
		// https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/2070
		| Iterable<[string, string]>
		| Record<string, string>;

	/**
	 * Hash (fragment) of the URL. `"#"` prefix is added if not present.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash)
	 */
	hash?: string;
} & (keyof P extends never
	? {
			/** Route pattern does not contain parameters */
			params?: never;
		}
	: {
			/** Route pattern parameters */
			params: P;
		});

export class Helper<Pattern extends string> {
	/** Extracted parameters type for the pattern */
	declare readonly Params: ExtractParams<Pattern>;

	/** Route pattern */
	pattern: Pattern;

	/** GET middleware */
	middleware: Middleware<any>[]; // any so you can use other middleware

	/** `<button>` component with preset `formaction` and `formmethod` attributes. */
	Button: (
		props: JSX.IntrinsicElements["button"] & UrlOptions<ExtractParams<Pattern>>,
	) => JSX.Element;

	/** `<form>` component with preset `method` and `action` attributes. */
	Form: (
		props: JSX.IntrinsicElements["form"] & UrlOptions<ExtractParams<Pattern>>,
	) => JSX.Element;

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

		this.Button = ({ params, search, hash, ...rest }) =>
			jsx("button", {
				formaction: this.url({ params, search, hash } as UrlOptions<
					ExtractParams<Pattern>
				>),
				formmethod: method,
				...rest,
			});

		this.Form = ({ params, search, hash, ...rest }) =>
			jsx("form", {
				action: this.url({ params, search, hash } as UrlOptions<
					ExtractParams<Pattern>
				>),
				method,
				...rest,
			});
	}

	/**
	 * Constructs a _relative_ URL for the route.
	 *
	 * @param [options] Options with type safe parameters
	 * @returns `pathname` + `search` + `hash`
	 */
	url(
		...[options]: keyof ExtractParams<Pattern> extends never
			? [UrlOptions<ExtractParams<Pattern>>] | []
			: [UrlOptions<ExtractParams<Pattern>>]
	) {
		const pathname = this.pathname(
			// @ts-expect-error - do not have to pass in {} if no params
			options?.params,
		);

		let search: string;
		if (options?.search) {
			if (options.search === true) {
				// forward current request's search
				search = Context.get().url.search;
			} else {
				// use the value as the init
				search =
					"?" +
					new URLSearchParams(
						options.search as ConstructorParameters<typeof URLSearchParams>[0],
					);
			}
		} else {
			search = "";
		}

		let hash: string;
		if (options?.hash) {
			// adding # prefix if not present matches the URL setter:
			// https://developer.mozilla.org/en-US/docs/Web/API/URL/hash
			if (options.hash.startsWith("#")) {
				hash = options.hash;
			} else {
				hash = "#" + options.hash;
			}
		} else {
			hash = "";
		}

		return pathname + search + hash;
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
