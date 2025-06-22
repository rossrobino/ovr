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

	const attributes: string[] = [];

	for (let key in rest) {
		const value = rest[key]; // needs to come before reassigning keys

		if (key === "className") key = "class";
		else if (key === "htmlFor") key = "for";

		if (value === true) {
			// just put the key without the value
			attributes.push(` ${key}`);
		} else if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "bigint"
		) {
			attributes.push(` ${key}="${Chunk.escape(String(value), true)}"`);
		}
		// otherwise, don't include the attribute
	}

	yield new Chunk(`<${tag}${attributes.join("")}>`, true);

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
 * @yields Chunks of HTML as the `Element` resolves.
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
				const yieldIterations = 50;
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

			const queue: (Chunk | null)[] = new Array(generators.length).fill(null);

			let current = 0;
			const complete = new Set<number>();

			for await (const {
				index,
				result: { done, value: chunk },
			} of merge(generators)) {
				if (done) {
					complete.add(index);

					if (index === current) {
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
				} else if (index === current) {
					yield chunk; // stream the current value directly
				} else {
					// queue the value for later
					if (queue[index]) queue[index].concat(chunk);
					else queue[index] = chunk;
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
export const toString = async (element: JSX.Element) => {
	const buffer: Chunk[] = [];
	for await (const chunk of toGenerator(element)) buffer.push(chunk);
	return buffer.join("");
};
