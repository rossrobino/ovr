import type { MaybeFunction, MaybePromise } from "../types/index.js";
import { Chunk } from "./chunk/index.js";
import type { Elements } from "./elements.js";
import { merge } from "./merge-async-iterables.js";

export namespace JSX {
	export interface IntrinsicElements extends Elements {}
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

export type Props = Record<string, unknown>;

export type FC<Props> = (props: Props) => JSX.Element;

// https://developer.mozilla.org/en-US/docs/Glossary/Void_element#self-closing_tags
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
 * @param tag string or function that refers to the component or element type
 * @param props object containing all the properties and attributes passed to the element or component
 * @returns an async generator that yields parts of HTML
 */
export async function* jsx(tag: FC<Props> | string, props: Props) {
	if (typeof tag === "function") {
		yield* toGenerator(tag(props));
	} else {
		// element
		const { children, ...attrs } = props;

		const attrParts: string[] = [];

		for (let key in attrs) {
			const value = attrs[key]; // needs to come before reassigning keys

			if (key === "className") key = "class";
			else if (key === "htmlFor") key = "for";

			if (value === true) {
				// just put the key without the value
				attrParts.push(` ${key}`);
			} else if (
				typeof value === "string" ||
				typeof value === "number" ||
				typeof value === "bigint"
			) {
				attrParts.push(` ${key}="${Chunk.escape(String(value), true)}"`);
			}
			// otherwise, don't include the attribute
		}

		yield new Chunk(`<${tag}${attrParts.join("")}>`, true);

		if (voidElements.has(tag)) return;

		if (children) yield* toGenerator(children);

		yield new Chunk(`</${tag}>`, true);
	}
}

/**
 * JSX requires a `Fragment` export to resolve <></>
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
	if (typeof element === "function") element = element();

	if (element instanceof Promise) element = await element;

	if (element == null || typeof element === "boolean" || element === "") return;

	if (element instanceof Chunk) {
		yield element;

		return;
	}

	if (typeof element === "object") {
		if (Symbol.asyncIterator in element) {
			for await (const children of element) yield* toGenerator(children);

			return;
		}

		if (Symbol.iterator in element) {
			const iterator = element[Symbol.iterator]();

			if (
				typeof iterator.next === "function" &&
				typeof iterator.throw === "function" &&
				typeof iterator.return === "function"
			) {
				// sync generator
				// process lazily - avoids loading all in memory
				while (true) {
					const result = iterator.next();
					if (result.done) break;
					yield* toGenerator(result.value);
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

	yield new Chunk(element); // primitive or other object
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
 * @returns A promise that resolves to the concatenated HTML.
 */
export const toString = async (element: JSX.Element) => {
	const chunks: Chunk[] = [];
	for await (const chunk of toGenerator(element)) chunks.push(chunk);
	return chunks.join("");
};
