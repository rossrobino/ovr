---
title: Loading
description: How to create a fallback loading component with CSS.
---

Work in progress - currently does not work in safari.

A `Loading` component created _without_ client-side JavaScript using CSS and ovr streaming.

```tsx
const Loading = (props: {
	children?: JSX.Element;
	fallback?: JSX.Element;
	after?: JSX.Element;
}) => (
	<>
		{props.fallback && (
			<div class="contents has-[+*>.loading-children:not(:empty)]:hidden">
				{props.fallback}
			</div>
		)}

		<div class="flex flex-col-reverse">
			{props.after && <div>{props.after}</div>}
			<div class="loading-children contents">{props.children}</div>
		</div>
	</>
);
```
