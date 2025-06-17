import { Page } from "ovr";

export const page = new Page("/escape", (c) => {
	return (
		<main>
			<h1>Escape Test</h1>
			<a href="/">Docs</a>

			<hr />

			<p>Normal paragraph</p>
			<div>{"<h2>This should be escaped</h2>"}</div>
		</main>
	);
});
