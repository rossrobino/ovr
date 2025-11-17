/**
 * @param iterator
 * @param i index of the iterator within the list
 * @returns promise containing the index and the next result of the iteration
 */
const next = async <T, R>(iterator: AsyncIterator<T, R>, i: number) => ({
	i,
	result: await iterator.next(),
});

/**
 * Merges `AsyncGenerator[]` into a single `AsyncGenerator`, resolving all in parallel.
 * The return of each `AsyncGenerator` is yielded from the generator with `done: true`.
 *
 * Adapted from [stack overflow answers](https://stackoverflow.com/questions/50585456).
 *
 * @param generators Resolved in parallel.
 * @yields `IteratorResult` and `index` of the resolved generator.
 */
export async function* merge<T>(generators: AsyncGenerator<T, void>[]) {
	const iterators = generators.map((gen) => gen[Symbol.asyncIterator]());
	const promises = new Map<number, ReturnType<typeof next<T, void>>>();

	for (let i = 0; i < iterators.length; i++) {
		promises.set(i, next(iterators[i]!, i));
	}

	let current: Awaited<ReturnType<typeof next>>;

	try {
		while (promises.size > 0) {
			yield (current = await Promise.race(promises.values()));

			if (current.result.done) {
				promises.delete(current.i);
			} else {
				promises.set(current.i, next(iterators[current.i]!, current.i));
			}
		}
	} finally {
		for (const iterator of iterators) {
			try {
				iterator.return();
			} catch {
				// could have already returned
			}
		}
	}
}
