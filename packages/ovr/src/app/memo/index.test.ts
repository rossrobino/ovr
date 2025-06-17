import { Memo } from "./index.js";
import { describe, test, expect, vi } from "vitest";

describe("Memo", () => {
	test("memoizes simple values based on arguments", () => {
		const memo = new Memo();
		const fn = vi.fn((a: number, b: number) => a + b);
		const memoized = memo.use(fn);

		expect(memoized(1, 2)).toBe(3);
		expect(memoized(1, 2)).toBe(3);
		expect(fn).toHaveBeenCalledTimes(1);

		expect(memoized(2, 3)).toBe(5);
		expect(fn).toHaveBeenCalledTimes(2);
		expect(memoized(2, 3)).toBe(5);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("returns the same wrapper for the same function", () => {
		const memo = new Memo();
		const fn = (a: number) => a * 2;
		const wrapper1 = memo.use(fn);
		const wrapper2 = memo.use(fn);
		expect(wrapper1).toBe(wrapper2);
	});

	test("does not memoize across Memo instances", () => {
		const fn = vi.fn((a: number) => a * 3);
		const memoA = new Memo();
		const memoB = new Memo();

		const memA = memoA.use(fn);
		const memB = memoB.use(fn);
		expect(memA).not.toBe(memB);

		memA(2);
		memB(2);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("memoizes using argument identities for objects and functions", () => {
		const memo = new Memo();
		const fn = vi.fn((o: object) => Object.keys(o).length);
		const memoized = memo.use(fn);

		const a = { x: 1 };
		const b = { x: 1 };
		expect(memoized(a)).toBe(1);
		expect(memoized(a)).toBe(1);
		expect(memoized(b)).toBe(1);
		expect(fn).toHaveBeenCalledTimes(2);

		const fnArg = () => "hi";
		expect(memoized(fnArg)).toBe(0); // {}.length === 0
		expect(memoized(fnArg)).toBe(0);
		expect(fn).toHaveBeenCalledTimes(3);
	});

	test("treats undefined and null as valid argument keys", () => {
		const memo = new Memo();
		const fn = vi.fn((a: any) =>
			a === undefined ? "undefined" : a === null ? "null" : a,
		);
		const memoized = memo.use(fn);

		expect(memoized(undefined)).toBe("undefined");
		expect(memoized(null)).toBe("null");
		expect(memoized(undefined)).toBe("undefined");
		expect(memoized(null)).toBe("null");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("handles no-argument functions", () => {
		const memo = new Memo();
		let count = 0;
		const fn = vi.fn(() => ++count);
		const memoized = memo.use(fn);

		expect(memoized()).toBe(1);
		expect(memoized()).toBe(1);
		expect(memoized()).toBe(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test("returns correct value for string/number boolean arguments", () => {
		const memo = new Memo();
		const fn = vi.fn((s: string, n: number, b: boolean) => `${s}-${n}-${b}`);
		const memoized = memo.use(fn);

		expect(memoized("x", 1, false)).toBe("x-1-false");
		expect(memoized("x", 1, false)).toBe("x-1-false");
		expect(memoized("x", 1, true)).toBe("x-1-true");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("deduplicates concurrent async calls with same arguments", async () => {
		const memo = new Memo();
		const fn = vi.fn(async (x: number) => {
			await new Promise((r) => setTimeout(r, 10));
			return x * 2;
		});
		const memoized = memo.use(fn);

		// Fire two calls at the same time
		const promise1 = memoized(5);
		const promise2 = memoized(5);

		// They should be strictly the same Promise
		expect(promise1).toBe(promise2);

		const [result1, result2] = await Promise.all([promise1, promise2]);
		expect(result1).toBe(10);
		expect(result2).toBe(10);

		// Under the hood only one computation should have happened
		expect(fn).toHaveBeenCalledTimes(1);

		// Calling again after initial computation will return cached resolved value (but not a new Promise)
		const result3 = await memoized(5);
		expect(result3).toBe(10);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
