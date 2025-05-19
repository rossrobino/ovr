import { html as docsHtml, headings } from "@/content/docs.md";
import { Page } from "ovr";

export const home = new Page("/", () => (
	<main>
		<h1>ovr</h1>
		<Nav />
		{docsHtml}
	</main>
));

const Nav = () => (
	<nav>
		<ul>
			{headings.map((heading) => {
				if (heading.level === 2) {
					return (
						<li>
							<a href={`#${heading.id}`}>{heading.name}</a>
						</li>
					);
				}

				return null;
			})}
		</ul>
	</nav>
);
