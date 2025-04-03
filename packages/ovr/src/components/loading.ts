import type { JSX } from "../jsx/index.js";

export const style = /* css */ `l-f,l-c{display:contents}l-f:has(+:not(:empty)){display:none}`;

/**
 * Wrap an async component with `Loading` to provide a loading fallback
 * to display before it resolves. The `Loading` component works without
 * client-side JavaScript using CSS to hide the fallback once the children
 * are streamed in.
 *
 * @param props
 *
 * @example
 *
 * ```tsx
 * <Loading fallback={<p>Loading...</p>}>
 * 	<AsyncComponent />
 * </Loading>
 * ```
 */
export async function* Loading(props: {
	/** Async component to provide a fallback for. */
	children: JSX.Element;

	/** Fallback to display while `children` are loading. */
	fallback: JSX.Element;
}): JSX.Element {
	yield `<l-f>`;
	yield props.fallback;
	yield "</l-f>";

	yield "<l-c>";
	yield props.children;
	yield "</l-c>";
}
