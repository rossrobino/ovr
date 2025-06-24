---
title: Parallelization
description: Understand how ovr processes async components in parallel.
---

With ovr, every component is streamed independently. You can read this content immediately instead of waiting for the last component to render. The delay does not waterfall, components are generated in parallel with `Promise.race`.

```tsx
const Delay = async ({ ms }: { ms: number }) => {
	await new Promise((res) => setTimeout(res, ms));
	return <div>{ms}ms</div>;
};

const Delays = () => {
	const delays = Array.from({ length: 6 }, (_, i) => i * 200);
	return delays.map((ms) => <Delay ms={ms} />);
};
```

---
