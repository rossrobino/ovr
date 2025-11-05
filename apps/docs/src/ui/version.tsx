import { version } from "ovr/package.json";

export const Version = () => {
	return (
		<a
			href="https://www.npmjs.com/package/ovr"
			class="button ghost font-mono text-xs no-underline"
		>
			v{version}
		</a>
	);
};
