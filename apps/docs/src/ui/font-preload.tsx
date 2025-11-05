import { chunk } from "client:page";

export const FontPreload = () =>
	chunk.src.assets.map((path) => (
		<link
			rel="preload"
			href={`/${path}`}
			as="font"
			type="font/woff2"
			crossorigin
		/>
	));
