---
"ovr": patch
---

fix: Prevent memory buildup when rendering large sync generators

When a synchronous generator function is encountered, ovr now processes and streams each yielded element individually instead of collecting all values into memory first. This prevents memory exhaustion when rendering large datasets like tables with thousands of rows.

```tsx
const Component = () => {
	return (
		<div>
			{function* () {
				for (const item of items) {
					yield <Item item={item} />;
				}
			}}
		</div>
	);
};
```

Previously, a generator yielding 10,000 JSX elements would create all 10,000 objects in memory before streaming began. Now each element is processed and streamed immediately, keeping memory usage constant regardless of dataset size.

Users can still choose arrays when parallel processing is important than memory efficiency.

```tsx
const Component = () => {
	return (
		<div>
			{items.map((item) => (
				<Item item={item} />
			))}
		</div>
	);
};
```
