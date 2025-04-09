const never = new Promise(() => {}) as Promise<any>;

const next = async <T, R>(iterator: AsyncIterator<T, R>, index: number) => ({
	index,
	result: await iterator.next(),
});

/**
 * Merges `AsyncIterable[]` into a single `AsyncGenerator`, resolving all in parallel.
 * The return of each `AsyncIterable` is yielded from the generator with `done: true`.
 *
 * Adapted from [stack overflow answers](https://stackoverflow.com/questions/50585456).
 *
 * @param iterables Resolved in parallel.
 * @yields `IteratorResult` and `index` of the resolved iterator.
 */
export async function* merge<T, R>(iterables: AsyncIterable<T, R>[]) {
	const iterators = iterables.map((iter) => iter[Symbol.asyncIterator]());
	const promises = iterators.map(next);

	let remaining = promises.length;
	let current;

	while (remaining) {
		yield (current = await Promise.race(promises));

		if (current.result.done) {
			promises[current.index] = never;
			remaining--;
		} else {
			promises[current.index] = next(iterators[current.index]!, current.index);
		}
	}
}
