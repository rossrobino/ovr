const next = async <T, R>(iterator: AsyncIterator<T, R>, index: number) => ({
	index,
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

	iterators.forEach((iterator, index) =>
		promises.set(index, next(iterator, index)),
	);

	let current: Awaited<ReturnType<typeof next>>;

	try {
		while (promises.size > 0) {
			yield (current = await Promise.race(promises.values()));

			if (current.result.done) {
				promises.delete(current.index);
			} else {
				promises.set(
					current.index,
					next(iterators[current.index]!, current.index),
				);
			}
		}
	} finally {
		for (const iterator of iterators) {
			// catch - could have already returned
			iterator.return().catch(() => {});
		}
	}
}
