import type { Method, Middleware } from "../app/index.js";
import { type JSX, jsx } from "../jsx/index.js";
import type { Params } from "../trie/index.js";
import type { ExtractParams, InsertParams } from "../types/index.js";
import { hash } from "../util/hash.js";

type UrlOptions<P extends Params> = {
	/**
	 * Passed into `URLSearchParams` constructor to create new params.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
	 */
	search?:
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

export class Route<Pattern extends string = string> {
	/** Extracted parameters type for the pattern */
	declare readonly Params: ExtractParams<Pattern>;

	/** Route pattern */
	readonly pattern: Pattern;

	/** HTTP method */
	readonly method: Method;

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
		method: Method,
		pattern: Pattern,
		...middleware: Middleware<ExtractParams<Pattern>>[]
	) {
		if (pattern[0] !== "/") {
			throw new Error(`Invalid pattern: ${pattern} - must begin with "/"`);
		}

		this.method = method;
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
	 * @param [options] Options with type safe pathname parameters
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
		let search = "";
		let hash = "";

		if (options?.search) {
			// use the value as the init
			// @ts-expect-error - see above
			search = "?" + new URLSearchParams(options.search);
		}

		if (options?.hash) {
			// adding # prefix if not present matches the URL setter:
			// https://developer.mozilla.org/en-US/docs/Web/API/URL/hash
			if (options.hash.startsWith("#")) {
				hash = options.hash;
			} else {
				hash = "#" + options.hash;
			}
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

export class Get<Pattern extends string = string> extends Route<Pattern> {
	/** `<a>` component with preset `href` attribute. */
	Anchor: (
		props: JSX.IntrinsicElements["a"] & UrlOptions<ExtractParams<Pattern>>,
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
				href: this.url({ params, search, hash } as UrlOptions<
					ExtractParams<Pattern>
				>),
				...rest,
			});
	}
}

export class Post<Pattern extends string = string> extends Route<Pattern> {
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
