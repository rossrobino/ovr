---
"ovr": minor
---

feat: adds `action` helper

Create an action and pass it into `app.post` to register a route automatically linked to the `action.Form`.

```tsx
// action.tsx
import { action } from "ovr";

export const posted = action((c) => {
	console.log("posted");
	c.redirect("/", 303);
});

export const Component = () => {
	return (
		<posted.Form>
			<input />
			<button>Submit</button>
		</posted.Form>
	);
};

// app.tsx
app.post(posted); // automatically registered to a unique pathname
```
