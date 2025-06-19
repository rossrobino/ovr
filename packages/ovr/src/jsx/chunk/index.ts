export class Chunk {
	static #attr = /[&"<]/g;
	static #content = /[&<]/g;

	/** Safe value to render */
	value: string;

	/**
	 * `Chunk` to send in an HTML stream.
	 *
	 * @param s string of HTML to escape
	 * @param safe Set to `true` if the HTML is safe and should not be escaped
	 */
	constructor(s: unknown, safe?: boolean) {
		const value = String(s ?? "");
		this.value = safe ? value : Chunk.escape(value);
	}

	/**
	 * @returns `value`
	 */
	toString() {
		return this.value;
	}

	/**
	 * @param chunks Chunks to append to the end of the chunk
	 */
	concat(...chunks: Chunk[]) {
		this.value += chunks.join("");
	}

	/**
	 * Escapes strings of HTML.
	 *
	 * @param s String to escape
	 * @param attr Set to `true` if the value is an attribute, otherwise it's a string of HTML content
	 * @returns Escaped string of HTML
	 */
	static escape(s: string, attr?: boolean) {
		// adapted from https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/escaping.js
		const regex = attr ? Chunk.#attr : Chunk.#content;

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
	}
}
