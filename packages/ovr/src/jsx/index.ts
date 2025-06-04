import type { MaybeFunction, MaybePromise } from "../types/index.js";
import type { Elements } from "./elements.js";
import { isGenerator } from "./is-generator.js";
import { merge } from "./merge-async-iterables.js";
import { YieldController } from "./yield-controller.js";

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

const yieldController = new YieldController();

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
				attrParts.push(` ${key}=${JSON.stringify(value)}`);
			}
			// otherwise, don't include the attribute
		}

		yield `<${tag}${attrParts.join("")}>`;

		if (voidElements.has(tag)) return;

		if (children) yield* toGenerator(children);

		yield `</${tag}>`;
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
 * @yields Rendered strings of HTML as the `Element` resolves.
 */
export async function* toGenerator(
	element: JSX.Element,
): AsyncGenerator<string, void, unknown> {
	if (typeof element === "function") element = element();
	if (element instanceof Promise) element = await element;

	if (element == null || typeof element === "boolean" || element === "") return;

	if (typeof element === "object") {
		if (Symbol.asyncIterator in element) {
			for await (const children of element) yield* toGenerator(children);
		} else if (Symbol.iterator in element) {
			if (isGenerator(element)) {
				// process lazily - avoid loading all in memory
				for (const children of element) yield* toGenerator(children);
			}

			const generators: AsyncGenerator<string, void, unknown>[] = [];

			for (const children of element) {
				generators.push(toGenerator(children));
			}

			let queue: string[] | string = new Array(generators.length).fill("");
			const complete = new Set<number>();

			let current = 0;
			for await (const { index, result } of merge(generators)) {
				const maybeYield = yieldController.maybeYield();
				// yield control back to event loop to stream current
				if (maybeYield instanceof Promise) await maybeYield;

				if (result.done) {
					complete.add(index);

					if (index === current) {
						while (++current < generators.length) {
							if (queue[current]) {
								// yield whatever is in the next queue even if it hasn't completed yet
								yield queue[current]!;
								queue[current] = "";
							}

							// if it hasn't completed, stop iterating to the next
							if (!complete.has(current)) break;
						}
					}
				} else if (index === current) {
					yield result.value; // stream the current value directly
				} else {
					queue[index] += result.value; // queue the value for later
				}
			}

			queue = queue.join("");
			if (queue) yield queue; // clear the queue
		} else {
			yield JSON.stringify(element); // avoids things like [object Object]
		}
	} else {
		yield String(element); // primitive
	}
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
	const parts: string[] = [];
	for await (const value of toGenerator(element)) parts.push(value);
	return parts.join("");
};
