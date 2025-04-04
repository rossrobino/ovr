import type { JSX } from "../jsx/index.js";

export const style = /* css */ `l-f,l-c{display:contents}l-f:has(+*>l-c:not(:empty)){display:none}l-a{display:flex;flex-direction:column-reverse}`;

/**
 * Wrap an async component with `Suspense` to provide a loading `fallback`
 * to display before it resolves. The `Suspense` component works without
 * client-side JavaScript using CSS to hide the `fallback` once the `children`
 * are streamed in and to reverse the order of the `children` and `after` elements.
 *
 * `fallback`, `after`, and `children` are resolved in parallel but streamed sequentially.
 *
 * @param props
 *
 * @example
 *
 * ```tsx
 * <Suspense fallback={<p>Loading...</p>} after={<footer>After</footer>}>
 * 	<AsyncComponent />
 * </Suspense>
 * ```
 */
export function Suspense(props: {
	/** Fallback to display while `children` are loading. */
	fallback?: JSX.Element;

	/**
	 * Element(s) to display _visually after_ the `children`, but stream/resolve before.
	 *
	 * Ensure `after` does take less time to resolve than `children`, otherwise
	 * `children` will be blocked until `after` resolves.
	 */
	after?: JSX.Element;

	/** Asynchronous element(s) to provide a fallback for. */
	children?: JSX.Element;
}): JSX.Element {
	const wrap = props.after != null ? "a" : "w";

	return [
		"<l-f>",
		props.fallback,
		"</l-f><l-" + wrap + "><div>",
		props.after,
		"</div><l-c>",
		props.children,
		"</l-c></l-" + wrap + ">",
	];
}
