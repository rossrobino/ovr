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
