export class Memo {
	/** Already memoized functions. */
	#memoized = new WeakMap<Function, Function>();

	/** Symbol to store the result of each memoized function. */
	static #RESULT = Symbol();

	/**
	 * Calls to the returned function with the same arguments will
	 * return a cached result.
	 *
	 * @param fn Function to memoize.
	 * @returns The memoized function.
	 */
	use<A extends any[], R>(fn: (...args: A) => R) {
		if (this.#memoized.has(fn)) return this.#memoized.get(fn) as typeof fn;

		// closure will GC automatically
		const trie = new Map();

		const memo = (...args: A): R => {
			let node = trie;

			for (const arg of args) {
				// get/create a node for each arg
				if (!node.has(arg)) node.set(arg, new Map());
				node = node.get(arg);
			}

			// set the final result if not there
			if (!node.has(Memo.#RESULT)) node.set(Memo.#RESULT, fn(...args));

			return node.get(Memo.#RESULT);
		};

		this.#memoized.set(fn, memo);

		return memo;
	}
}
