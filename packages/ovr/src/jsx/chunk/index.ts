export class Chunk {
	static #attr = /[&"<]/g;
	static #content = /[&<]/g;
	static #map = { "&": "&amp;", '"': "&quot;", "<": "&lt;" } as const;

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
	 * @param chunk Chunk to append to the end of the chunk
	 */
	concat(chunk: Chunk) {
		this.value += chunk;
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
		// adapted from https://github.com/remix-run/remix/blob/1a2fcffb50101b789abde35a5edcbcb28e740587/packages/html-template/src/lib/safe-html.ts#L24
		return html.replace(
			attr ? Chunk.#attr : Chunk.#content,
			(c) =>
				// @ts-expect-error - private method type error
				Chunk.#map[c],
		);
	}
}
