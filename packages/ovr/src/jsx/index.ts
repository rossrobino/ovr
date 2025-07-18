import type { MaybeFunction, MaybePromise } from "../types/index.js";
import { Chunk } from "./chunk/index.js";
import type { IntrinsicElements as IE } from "./intrinsic-elements.js";
import { merge } from "./merge-async-generators.js";
import { setImmediate } from "node:timers/promises";

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

/** Unknown component props. */
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
 * it is passed into this function to be resolved.
 *
 * @param tag string or function component
 * @param props object containing all the properties and attributes passed to the element or component
 * @returns an async generator that yields `Chunk`s of HTML
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
	const { children, ...rest } = props;

	let attributes = "";

	for (const key in rest) {
		const value = rest[key];

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

	yield new Chunk(`<${tag}${attributes}>`, true);

	if (voidElements.has(tag)) return;

	yield* toGenerator(children);

	yield new Chunk(`</${tag}>`, true);
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
 * @yields `Chunk`s of HTML as the `Element` resolves.
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
			// async iterable - lazily resolve
			for await (const children of element) yield* toGenerator(children);

			return;
		}

		if (Symbol.iterator in element) {
			// sync iterable
			const iterator = element[Symbol.iterator]();

			if (
				typeof iterator.next === "function" &&
				typeof iterator.throw === "function" &&
				typeof iterator.return === "function"
			) {
				// sync generator
				// process lazily - avoids loading all in memory
				const yieldIterations = 150;
				let yieldCounter = yieldIterations;

				while (true) {
					const result = iterator.next();

					if (result.done) break;
					yield* toGenerator(result.value);

					if (--yieldCounter === 0) {
						// yields back to the event loop to send chunks
						// or check if the request has been cancelled
						await setImmediate();
						yieldCounter = yieldIterations;
					}
				}

				return;
			}

			// other iterable - array, set, etc.
			// process children in parallel
			const generators: AsyncGenerator<Chunk, void, unknown>[] = [];

			while (true) {
				const result = iterator.next();
				if (result.done) break;
				generators.push(toGenerator(result.value));
			}

			const queue: (Chunk | null)[] = new Array(generators.length);
			const complete = new Set<number>();
			let current = 0;

			for await (const m of merge(generators)) {
				if (m.result.done) {
					complete.add(m.index);

					if (m.index === current) {
						while (++current < generators.length) {
							if (queue[current]) {
								// yield whatever is in the next queue even if it hasn't completed yet
								yield queue[current]!;
								queue[current] = null;
							}

							// if it hasn't completed, stop iterating to the next
							if (!complete.has(current)) break;
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
			yield* queue.filter(Boolean) as Chunk[];

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
				// need to encode for Node JS (ex: during prerendering)
				// faster than piping through a `TextEncoderStream`
				encoder.encode(result.value.value),
			);
		},

		cancel() {
			gen.return();
		},
	});
};
