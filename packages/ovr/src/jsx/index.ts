import type { MaybeFunction, MaybePromise } from "../types/index.js";
import { Chunk } from "./chunk/index.js";
import type { IntrinsicElements as IE } from "./intrinsic-elements.js";
import { merge } from "./merge-async-generators.js";

/** ovr JSX namespace */
export namespace JSX {
	/** Standard HTML elements */
	export interface IntrinsicElements extends IE {}

	/** ovr Element */
	export type Element = MaybeFunction<
		MaybePromise<
			| string
			| number
			| bigint
			| boolean
			| object
			| null
			| undefined
			| Symbol
			| Iterable<Element>
			| AsyncIterable<Element>
		>
	>;
}

/** Unknown component props */
export type Props = Record<string, JSX.Element>;

/**
 * These are the HTML tags that do not require a closing tag.
 *
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Glossary/Void_element#self-closing_tags)
 */
const voidElements = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);

/**
 * The main function of the JSX transform cycle, each time JSX is encountered
 * it is passed into this function to be resolved. This function doesn't need to be
 * called recursively, JSX will be transformed into these `jsx()` function calls.
 *
 * @param tag string or function component
 * @param props object containing all the properties and attributes passed to the element or component
 * @returns `AsyncGenerator` that yields `Chunk`s of HTML
 */
export async function* jsx<P extends Props = Props>(
	tag: ((props: P) => JSX.Element) | string,
	props: P,
) {
	if (typeof tag === "function") {
		// component or fragment
		yield* toGenerator(tag(props));
		return;
	}

	// intrinsic element
	// faster to concatenate attributes than to yield them as separate chunks
	let attributes = "";

	for (const key in props) {
		// more memory efficient to skip children instead of destructuring and using ...rest
		if (key === "children") continue;

		const value = props[key];

		if (value === true) {
			// just put the key without the value
			attributes += ` ${key}`;
		} else if (typeof value === "string") {
			attributes += ` ${key}="${Chunk.escape(value, true)}"`;
		} else if (typeof value === "number" || typeof value === "bigint") {
			attributes += ` ${key}="${value}"`;
		}
		// otherwise, don't include the attribute
	}

	if (tag === "html") yield Chunk.safe("<!doctype html>");

	yield Chunk.safe(`<${tag}${attributes}>`);

	if (voidElements.has(tag)) return;

	yield* toGenerator(props.children);

	yield Chunk.safe(`</${tag}>`);
}

/**
 * JSX requires a `Fragment` export to resolve `<></>`
 *
 * @param props containing `children` to render
 * @returns async generator that yields concatenated children
 */
export async function* Fragment(props: { children?: JSX.Element } = {}) {
	yield* toGenerator(props.children);
}

/**
 * @param element
 * @yields `Chunk`s of HTML as the `Element` resolves
 */
export async function* toGenerator(
	element: JSX.Element,
): AsyncGenerator<Chunk, void, unknown> {
	// modifications
	// these are required to allow functions to be used as children
	// instead of creating a separate component to use them
	if (typeof element === "function") element = element();
	if (element instanceof Promise) element = await element;

	// resolve based on type
	// should not render
	if (element == null || typeof element === "boolean" || element === "") return;

	if (element instanceof Chunk) {
		// already escaped or safe
		yield element;
		return;
	}

	if (typeof element === "object") {
		if (Symbol.asyncIterator in element) {
			// any async iterable - lazily resolve
			for await (const children of element) yield* toGenerator(children);
			return;
		}

		if (Symbol.iterator in element) {
			// sync iterable
			if ("next" in element) {
				// sync generator - lazily resolve, avoids loading all in memory
				for (const children of element) yield* toGenerator(children);
				return;
			}

			// other iterable - array, set, etc.
			// process children in parallel
			const generators = Array.from(element, toGenerator);
			const n = generators.length;
			const queue = new Array<Chunk | null>(n);
			const complete = new Uint8Array(n);
			let current = 0;

			for await (const m of merge(generators)) {
				if (m.result.done) {
					complete[m.index] = 1;

					if (m.index === current) {
						while (++current < n) {
							if (queue[current]) {
								// yield whatever is in the next queue even if it hasn't completed yet
								yield queue[current]!;
								queue[current] = null;
							}

							// if it hasn't completed, stop iterating to the next
							if (!complete[current]) break;
						}
					}
				} else if (m.index === current) {
					yield m.result.value; // stream the current value directly
				} else {
					// queue the value for later
					if (queue[m.index]) queue[m.index]!.concat(m.result.value);
					else queue[m.index] = m.result.value;
				}
			}

			// clear the queue
			yield* queue.filter((chunk) => chunk !== null);
			return;
		}
	}

	// primitive or other object
	yield new Chunk(element);
}

/**
 * Converts a `JSX.Element` into a fully concatenated string of HTML.
 *
 * ### WARNING
 *
 * This negates streaming benefits and buffers the result into a string.
 * Use `toGenerator` whenever possible.
 *
 * @param element
 * @returns Concatenated HTML
 */
export const toString = async (element: JSX.Element) =>
	(await Array.fromAsync(toGenerator(element))).join("");

/** Single encoder to use across requests. */
const encoder = new TextEncoder();

/**
 * `toGenerator` piped into a `ReadableStream`.
 * Use `toGenerator` when possible to avoid the overhead of the stream.
 *
 * @param element
 * @returns `ReadableStream` of HTML
 */
export const toStream = (element: JSX.Element) => {
	const gen = toGenerator(element);

	return new ReadableStream<Uint8Array>({
		async pull(c) {
			const result = await gen.next();

			if (result.done) {
				c.close();
				gen.return();
				return;
			}

			c.enqueue(
				// need to encode for Node JS (ex: during prerendering) or it will error
				// doesn't seem to be needed for browsers
				// faster than piping through a `TextEncoderStream`
				encoder.encode(result.value.value),
			);
		},

		cancel() {
			gen.return();
		},
	});
};
