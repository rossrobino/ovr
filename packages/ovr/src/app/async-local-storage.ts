import type { Context } from "./context.js";
import type { Params } from "./index.js";
import { AsyncLocalStorage } from "node:async_hooks";

/** Used to store context per request. */
export const asyncLocalStorage = new AsyncLocalStorage<Context<any, Params>>();

/**
 * Call within the scope of a handler to get the current context.
 *
 * @returns The request context.
 *
 * @example
 *
 * ```ts
 * import { context } from "ovr";
 *
 * const app = new Router();
 *
 * const fn = () => {
 * 	const c = context();
 * 	// ...
 * }
 *
 * app.get("/", () => {
 * 	fn(); // OK
 * });
 *
 * fn() // ReferenceError - outside AsyncLocalStorage scope
 * ```
 */
export const context = () => {
	const c = asyncLocalStorage.getStore();

	if (!c)
		throw new ReferenceError("Context can only be obtained within a handler.");

	return c;
};
