import { content } from "@/content";
import * as demo from "@/server/demo";
import { Popover } from "@/ui/popover";
import clsx from "clsx";
import { Context, type JSX } from "ovr";

export const Layout = (props: { children?: JSX.Element }) => {
	return (
		<drab-prefetch
			trigger="a[href^='/']:not([data-no-prefetch])"
			prerender
			class="block"
		>
			<header class="flex justify-between gap-4 p-4 md:hidden">
				<HomeLink />
				<nav>
					<Popover
						title="ovr"
						titleHref="/"
						trigger={{
							children: <span class="icon-[lucide--align-justify]"></span>,
						}}
					>
						<NavList />
					</Popover>
				</nav>
			</header>
			<main class="flex">
				<div>
					<nav class="sticky top-0 z-10 hidden min-w-52 flex-col gap-4 p-4 md:flex">
						<HomeLink />
						<NavList />
					</nav>
				</div>
				<div class="flex w-full min-w-0 flex-row-reverse justify-between">
					<TOC />
					<div class="flex w-full min-w-0 justify-center">
						<div class="prose max-w-3xl min-w-0 px-4 pt-3.5 pb-4">
							{props.children}
							<hr class="my-12" />
						</div>
					</div>
				</div>
			</main>
		</drab-prefetch>
	);
};

const TOC = () => {
	const { pathname } = Context.get().url;
	const result =
		content[`/content${pathname === "/" ? "/index" : pathname}.md`];

	if (!result) return;

	return (
		<div>
			<aside class="sticky top-0 hidden min-w-52 flex-col gap-3 p-4 lg:flex">
				<h2 class="text-muted-foreground pl-3 text-sm uppercase">
					<a href="#">On this page</a>
				</h2>
				<ul class="grid gap-1">
					{result?.headings.map((heading) => {
						if (heading.level !== 2) return;

						return (
							<li>
								<a
									class="button ghost h-8 justify-start px-3 capitalize"
									href={`#${heading.id}`}
								>
									{heading.name}
								</a>
							</li>
						);
					})}
				</ul>
			</aside>
		</div>
	);
};

const HomeLink = () => {
	return (
		<a href="/" class="text-lg font-bold no-underline">
			ovr
		</a>
	);
};

const NavList = () => {
	const slugs = Object.keys(content).map((path) => {
		let slug = path.split("/").at(2)?.split(".").at(0)!;
		if (slug === "index") slug = "";
		return slug;
	});

	return (
		<ul class="grid gap-1">
			{slugs.map((slug) => {
				return <NavLink slug={slug} />;
			})}
			<li>
				<demo.page.Anchor
					data-no-prefetch
					class={clsx(
						"button secondary justify-start capitalize",
						demo.page.pattern !== Context.get().url.pathname && "ghost",
					)}
				>
					Demo
				</demo.page.Anchor>
			</li>
		</ul>
	);
};

const NavLink = (props: { slug?: string; anchor?: JSX.Element }) => {
	if (!props.slug) return;
	const href = `/${props.slug}`;
	const current = href === Context.get().url.pathname;

	return (
		<li>
			<a
				class={clsx(
					"button secondary justify-start capitalize",
					!current && "ghost",
				)}
				href={href}
			>
				{props.slug.split("-").slice(1).join(" ")}
			</a>
		</li>
	);
};
