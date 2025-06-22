---
title: Memory Optimization
description: Demo of using sync generators to optimize memory usage.
---

# Memory Optimization

Using generators can reduce memory consumption which can be useful if you are rendering a large HTML page. Instead of creating the entire component in memory by mapping through a large array:

```tsx
function Numbers() {
	const nums = Array.from({ length: 10_000 }, (_, i) => i);
	return nums.map((i) => <div>{i}</div>);
}
```

You can use a generator to `yield` elements as you iterate through the array.

```tsx
function* Numbers() {
	let i = 0;
	while (i < 5_000) yield <div>{i++}</div>;
}
```

This allows the server to send the result as it iterates through the generator, users also see the start of the content faster. If you are on a browser that displays the scrollbar, you can refresh the page to view the elements streaming in, or open your network tab to watch the request.

## 5,000 divs
