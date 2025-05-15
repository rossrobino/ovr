import { Page, Action } from "ovr";

export const action = new Action((c) => {
	console.log("posted");
	c.redirect("/");
});

export const page = new Page("/action/:param", (c) => (
	<div>
		<page.Anchor params={c.params}>Hello</page.Anchor>

		<action.Form>
			<input />
			<button>Submit</button>
		</action.Form>
	</div>
));

export const noParam = new Page("/no/params", () => {
	return <noParam.Anchor>No params</noParam.Anchor>;
});
