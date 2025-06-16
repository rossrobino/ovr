import type { Params } from "./index.js";

/**
 * @param parts Pattern parts
 * @param params Parameters to insert
 * @returns Resolved pathname with params
 */
export const insertParams = (parts: string[], params: Params) => {
	const wild = "*";

	return parts
		.map((part) => {
			if (part.startsWith(":")) {
				const param = part.slice(1);

				if (!(param in params))
					throw new Error(`Parameter "${param}" did not match pattern.`);

				return params[param as keyof typeof params];
			}

			if (part === wild) {
				if (!(wild in params)) throw new Error("No wildcard parameter found.");

				return params[wild];
			}

			return part;
		})
		.join("/");
};
