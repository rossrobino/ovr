import { Page } from "ovr";
import { Action } from "ovr";

export const action = new Action((c) => {
	console.log("posted");
	c.redirect("/");
});

export const page = new Page("/action/:param", (c) => {
	return (
		<>
			<page.Link params={c.params}>Hello</page.Link>

			<action.Form>
				<input />
				<button>Submit</button>
			</action.Form>
		</>
	);
});

export const noParam = new Page("/no/params", () => {
	return <noParam.Link>No params</noParam.Link>;
});
