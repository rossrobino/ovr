export class Chunk {
	static #attr = /[&"<]/g;
	static #content = /[&<]/g;

	/** Safe value to render */
	value: string;

	/**
	 * `Chunk` to send in an HTML stream.
	 *
	 * @param html string of HTML to escape
	 * @param safe Set to `true` if the HTML is safe and should not be escaped
	 */
	constructor(html: unknown, safe?: boolean) {
		const value = String(html ?? "");
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
	 * Wraps `new Chunk("html", true)`.
	 *
	 * Use to create a new `Chunk` and bypass escaping.
	 *
	 * @param html Safe string of HTML
	 * @returns New _safe_ `Chunk`
	 */
	static safe(html: unknown) {
		return new Chunk(html, true);
	}

	/**
	 * Escapes strings of HTML.
	 *
	 * @param html String to escape
	 * @param attr Set to `true` if the value is an attribute, otherwise it's a string of HTML content
	 * @returns Escaped string of HTML
	 */
	static escape(html: string, attr?: boolean) {
		// adapted from https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/escaping.js
		const regex = attr ? Chunk.#attr : Chunk.#content;

		// search starts at beginning of the string
		regex.lastIndex = 0;
		// tracks the position of the last successful match in the input string
		let start = 0;
		let result = "";

		// since `g` flag is used, regex maintains state with each loop,
		// checking from the lastIndex onward each time
		while (regex.test(html)) {
			// index of the match
			const i = regex.lastIndex - 1;
			const match = html[i];

			result +=
				// everything that didn't match during this test
				html.slice(start, i) +
				// replacement
				(match === "&" ? "&amp;" : match === '"' ? "&quot;" : "&lt;");
			start = regex.lastIndex;
		}

		return result + html.slice(start);
	}
}
