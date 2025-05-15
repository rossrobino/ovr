import { Delay } from "./delay";
import { Page, Action, Suspense } from "ovr";

export const action = new Action((c) => {
	console.log("posted");
	c.redirect("/test");
});

export const test = new Page("/test", () => {
	return (
		<main>
			<h1>test</h1>

			<actionPage.Anchor params={{ param: "action" }}>Action</actionPage.Anchor>

			<Suspense
				fallback={<p>Loading...</p>}
				children={<Delay ms={1000} />}
				after={
					<>
						<h2>After</h2>
						<Suspense fallback={<p>Loading...</p>}>
							<Delay ms={500} />
						</Suspense>
					</>
				}
			/>
		</main>
	);
});

export const actionPage = new Page("/test/action/:param", (c) => (
	<div>
		<actionPage.Anchor params={c.params}>Hello</actionPage.Anchor>

		<action.Form>
			<input />
			<button>Submit</button>
		</action.Form>
	</div>
));
