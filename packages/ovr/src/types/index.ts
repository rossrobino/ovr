import type { Params } from "../trie/index.js";

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

export type InsertParams<
	Pattern extends string,
	P extends Params,
> = Pattern extends `${infer Start}:${infer Param}/${infer Rest}`
	? Param extends keyof P
		? `${Start}${P[Param]}/${InsertParams<Rest, P>}`
		: Pattern
	: Pattern extends `${infer Start}:${infer Param}`
		? Param extends keyof P
			? `${Start}${P[Param]}`
			: Pattern
		: Pattern extends `${infer Start}*`
			? "*" extends keyof P
				? `${Start}${P["*"]}`
				: Pattern
			: Pattern;
