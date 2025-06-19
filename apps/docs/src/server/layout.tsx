import type { JSX } from "ovr";

export const Layout = (props: { children?: JSX.Element }) => {
	return <main class="prose mx-auto max-w-[75ch] p-4">{props.children}</main>;
};
