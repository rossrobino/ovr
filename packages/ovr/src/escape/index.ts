const attrRegex = /[&"<]/g;
const contentRegex = /[&<]/g;

/**
 * Escapes strings of HTML.
 *
 * @param value Converted to a string, then escaped.
 * @param attr Set to `true` if the value is an attribute, otherwise it's a string of HTML content
 * @returns Escaped string of HTML
 */
export const escape = (value: unknown, attr?: boolean) => {
	// copied and adapted from https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/escaping.js
	const s = String(value ?? "");
	const regex = attr ? attrRegex : contentRegex;

	// search starts at beginning of the string
	regex.lastIndex = 0;
	// tracks the position of the last successful match in the input string
	let start = 0;
	let result = "";

	// since `g` flag is used, regex maintains state with each loop,
	// checking from the lastIndex onward each time
	while (regex.test(s)) {
		// index of the match
		const i = regex.lastIndex - 1;
		const match = s[i];

		result +=
			// everything that didn't match during this test
			s.slice(start, i) +
			// replacement
			(match === "&" ? "&amp;" : match === '"' ? "&quot;" : "&lt;");

		start = regex.lastIndex;
	}

	return result + s.slice(start);
};
