import { html as docsHtml, headings } from "@/content/docs.md";
import { Suspense, Page } from "ovr";

export const home = new Page("/", () => (
	<main>
		<Suspense
			fallback={<h1>...</h1>}
			children={async function* () {
				yield "<h1>o";
				await delay();
				yield "v";
				await delay();
				yield "r</h1>";
			}}
			after={<Docs />}
		/>
	</main>
));

const delay = () => new Promise((r) => setTimeout(r, 300));

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

const Docs = () => (
	<>
		<Nav />
		{docsHtml}
	</>
);
