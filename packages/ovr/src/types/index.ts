import type { Params } from "../app/index.js";
import type { JSX } from "../jsx/index.js";

export type MaybePromise<T> = T | Promise<T>;

export type MaybeFunction<T> = T | (() => T);

export type DeepArray<T> = T | DeepArray<T>[];

export type ExtractParams<Pattern extends string = string> =
	Pattern extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [k in Param | keyof ExtractParams<Rest>]: string }
		: Pattern extends `${infer _Start}:${infer Param}`
			? { [k in Param]: string }
			: Pattern extends `${infer _Rest}*`
				? { "*": string }
				: {};

export type ExtractMultiParams<Patterns extends string[]> = Patterns extends [
	infer First extends string,
	...infer Rest extends string[],
]
	? Rest["length"] extends 0
		? ExtractParams<First>
		: ExtractParams<First> | ExtractMultiParams<Rest>
	: never;

export type AnchorProps<P extends Params> = JSX.IntrinsicElements["a"] &
	(keyof P extends never ? { params?: never } : { params: P });

export type FormProps<P extends Params> = JSX.IntrinsicElements["form"] &
	(keyof P extends never ? { params?: never } : { params: P });

export type ButtonProps<P extends Params> = JSX.IntrinsicElements["button"] &
	(keyof P extends never ? { params?: never } : { params: P });
