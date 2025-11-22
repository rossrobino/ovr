/** Chunk containing the HTML from a rendered element */
export class Chunk {
	static readonly #attr = /[&"<]/g;
	static readonly #content = /[&<]/g;
	static readonly #map = { "&": "&amp;", '"': "&quot;", "<": "&lt;" };

	/** Safe value to render */
	value: string;

	/**
	 * Chunk containing the HTML from a rendered element.
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
	 * @param chunk Chunk to append to the end of the chunk
	 */
	concat(chunk: Chunk) {
		this.value += chunk;
	}

	/**
	 * Create a new `Chunk` and bypass escaping.
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
		return html.replace(
			attr ? Chunk.#attr : Chunk.#content,
			(c) =>
				// @ts-expect-error - private method type error
				Chunk.#map[c],
		);
	}
}
