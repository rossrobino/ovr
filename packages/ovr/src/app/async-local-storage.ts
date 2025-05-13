import type { Context } from "./context.js";
import type { Params } from "./index.js";
import { AsyncLocalStorage } from "node:async_hooks";

/** Used to store context per request. */
export const asyncLocalStorage = new AsyncLocalStorage<Context<any, Params>>();
