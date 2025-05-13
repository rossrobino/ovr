---
"ovr": minor
---

feat: adds `form()` helper

Create a JSX form and pass it into `app.post` to register a route automatically linked to the form's action.

```tsx
import { form } from "ovr";

export const Form = form((c) => {
	console.log("posted");
	c.redirect("/", 303);
});

export const Component = () => {
	return (
		<Form>
			<input type="text" />
			<button>Submit</button>
		</Form>
	);
};
```

```ts
import { Form } from "./form";

//...

app.post(Form); // automatically registered to a unique route
```
