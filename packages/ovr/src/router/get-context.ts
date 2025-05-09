import type { Context } from "./context.js";
import type { Params } from "./index.js";
import { AsyncLocalStorage } from "node:async_hooks";

export const asyncLocalContext = new AsyncLocalStorage<Context<any, Params>>();

/** Helper to get the current context within a handler. */
export const context = () => {
	const c = asyncLocalContext.getStore();

	if (!c)
		throw new Error(
			"Context not set: Context can only be obtained within a handler.",
		);

	return c;
};
