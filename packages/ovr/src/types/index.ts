import type { Trie } from "../trie/index.js";

export type MaybePromise<T> = T | Promise<T>;

export type MaybeFunction<T> = T | (() => T);

export type DeepArray<T> = T | DeepArray<T>[];

/** HTTP Method */
export type Method =
	| "GET"
	| "HEAD"
	| "POST"
	| "PUT"
	| "DELETE"
	| "CONNECT"
	| "OPTIONS"
	| "TRACE"
	| "PATCH"
	| (string & {});

/** Helper type to extract the route params (`:slug`) into a record */
export type ExtractParams<Pattern extends string = string> =
	Pattern extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [k in Param | keyof ExtractParams<Rest>]: string }
		: Pattern extends `${infer _Start}:${infer Param}`
			? { [k in Param]: string }
			: Pattern extends `${infer _Rest}*`
				? { "*": string }
				: {};

/** Helper type to insert a record of params into a resolved string */
export type InsertParams<
	Pattern extends string,
	Params extends Trie.Params,
> = Pattern extends `${infer Start}:${infer Param}/${infer Rest}`
	? Param extends keyof Params
		? `${Start}${Params[Param]}/${InsertParams<Rest, Params>}`
		: Pattern
	: Pattern extends `${infer Start}:${infer Param}`
		? Param extends keyof Params
			? `${Start}${Params[Param]}`
			: Pattern
		: Pattern extends `${infer Start}*`
			? "*" extends keyof Params
				? `${Start}${Params["*"]}`
				: Pattern
			: Pattern;
