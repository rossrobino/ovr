import { Chunk, type JSX, Page } from "ovr";

const notSafe = "<p>Not safe</p>";
const safe = new Chunk("<p>Safe</p>", true);

const attrTest = JSON.stringify({ attr: "test" });

export const page = new Page("/escape", () => {
	return (
		<>
			<h1>Escape Test</h1>
			<a href="/">Docs</a>

			<hr />

			<p>Normal paragraph</p>

			<hr />

			<div>{notSafe}</div>

			<hr />

			<div>
				{notSafe}
				{notSafe}
			</div>

			<hr />

			<Component>{notSafe}</Component>

			<hr />

			<Component>
				{notSafe}
				{notSafe}
				{safe}
				<Component>{notSafe}</Component>
			</Component>

			<hr />

			<div>
				{safe}
				{notSafe}
			</div>

			<hr />

			<p class={attrTest}>Attribute test</p>

			<hr />

			<p>zero</p>

			<p>{0}</p>
		</>
	);
});

const Component = (props: { children?: JSX.Element }) => {
	return <div>{props.children}</div>;
};
