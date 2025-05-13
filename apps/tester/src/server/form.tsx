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
