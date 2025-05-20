import { html as docsHtml, headings } from "@/content/docs.md";
import { Page } from "ovr";
import { name, description } from "ovr/package.json";

export const home = new Page("/", (c) => {
	c.head(
		<>
			<title>{name}</title>
			<meta name="description" content={description} />
		</>,
	);

	return (
		<main>
			<h1>{name}</h1>
			<p>{description}</p>
			<p>
				<a href="https://github.com/rossrobino/ovr">GitHub</a> | MIT License
			</p>
			<Nav />
			{docsHtml}
		</main>
	);
});

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
