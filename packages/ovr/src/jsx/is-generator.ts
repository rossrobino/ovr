export const isGenerator = <T, R = unknown, N = unknown>(
	iterable: Iterable<T, R, N>,
): iterable is Generator<T, R, N> => {
	const iterator = iterable[Symbol.iterator]();

	return (
		iterable != null &&
		typeof iterator.next === "function" &&
		typeof iterator.throw === "function" &&
		typeof iterator.return === "function"
	);
};
