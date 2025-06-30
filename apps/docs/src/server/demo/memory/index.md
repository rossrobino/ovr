---
title: Memory Optimization
description: Demo of using sync generators to optimize memory usage.
---

Using generators can reduce memory consumption which can be useful if you are rendering a large HTML page. Instead of creating the entire component in memory by mapping through a large array:

```tsx
function Numbers() {
	const nums = Array.from({ length: 5_000 }, (_, i) => i);
	return nums.map((i) => <div>{i}</div>);
}
```

You can use a generator to `yield` elements as you iterate through the array. This allows the server to send the result as it iterates through the generator, users also see the start of the content faster.

```tsx
function* Numbers() {
	let i = 0;
	while (i < 5_000) {
		i++;
		yield <div class="bg-foreground rounded-sm p-0.5" />;
	}
}
```

---
