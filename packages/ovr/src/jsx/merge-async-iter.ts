class Handler<T, R> {
	/** Original index of the iterator. */
	index: number;

	/** Asynchronous iterator to merge. */
	iterator: AsyncIterator<T, R>;

	/**
	 * Holds the result of `next`. This needs to exist because next should only
	 * be called when the iterator returns, so store the promise and only call
	 * next when it resolves.
	 */
	promise: Promise<{ result: IteratorResult<T, R>; handler: Handler<T, R> }>;

	/**
	 * @param index Index to return in `promise` to track which iterator resolved.
	 * @param iterator Asynchronous iterator to merge.
	 */
	constructor(index: number, iterator: AsyncIterator<T, R>) {
		this.index = index;
		this.iterator = iterator;
		this.promise = this.next();
	}

	/**
	 * @returns The result and a reference to the handler to know which iterator finished.
	 */
	next() {
		return (this.promise = this.iterator.next().then((result) => ({
			result,
			handler: this,
		})));
	}

	/**
	 * @param handlers
	 * @yields The current `promise` of each handler.
	 */
	static *promises<T, R>(handlers: Iterable<Handler<T, R>>) {
		for (const handler of handlers) yield handler.promise;
	}
}

/**
 * Merges iterables or iterators into a single iterator.
 *
 * @param iters Resolved in parallel.
 * @yields `IteratorResult` and `index` of the resolved iterator.
 */
export async function* mergeAsyncIter<T, R>(
	iters: (AsyncIterable<T, R> | AsyncIterator<T, R>)[],
) {
	const handlers = new Set<Handler<T, R>>();

	for (let i = 0; i < iters.length; i++) {
		const iter = iters[i]!;

		handlers.add(
			new Handler<T, R>(
				i,
				// allows for both Iterable and Iterator
				Symbol.asyncIterator in iter ? iter[Symbol.asyncIterator]() : iter,
			),
		);
	}

	while (handlers.size) {
		// race only resolves the fastest promise, the others are left for the next iteration
		const { result, handler } = await Promise.race(Handler.promises(handlers));

		yield { index: handler.index, ...result };

		if (result.done) handlers.delete(handler);
		else handler.next();
	}
}
