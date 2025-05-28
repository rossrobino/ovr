import { Page, Action } from "ovr";

async function Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	return <p>{props.ms}ms</p>;
}

export const action = new Action((c) => {
	console.log("posted");
	c.redirect("/test");
});

export const test = new Page("/test", () => {
	return (
		<main>
			<h1>test</h1>

			<actionPage.Anchor params={{ param: "param" }}>Action</actionPage.Anchor>

			<Delay ms={500} />
			<Delay ms={1000} />
			<Delay ms={500} />
		</main>
	);
});

export const actionPage = new Page("/test/action/:param", (c) => (
	<main>
		<p>
			<actionPage.Anchor params={c.params}>Hello</actionPage.Anchor>
		</p>

		<action.Form>
			<input />
			<button>Submit</button>
		</action.Form>
	</main>
));
