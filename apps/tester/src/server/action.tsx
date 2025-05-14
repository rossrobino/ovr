import { action } from "ovr";

export const posted = action((c) => {
	console.log("posted");
	c.redirect("/");
});

export const Component = () => (
	<posted.Form>
		<input />
		<button>Submit</button>
	</posted.Form>
);
