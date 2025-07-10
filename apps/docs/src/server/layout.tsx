import * as demos from "@/server/demo";
import * as docs from "@/server/docs";
import * as homeResult from "@/server/home/index.md";
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
						<div class="flex flex-col gap-4">
							<NavList />
						</div>
					</Popover>
				</nav>
			</header>
			<main class="flex">
				<div>
					<nav class="sticky top-0 z-10 hidden max-h-dvh min-w-52 flex-col gap-4 overflow-y-auto p-4 md:flex">
						<HomeLink />
						<NavList />
					</nav>
				</div>
				<div class="flex w-full min-w-0 flex-row-reverse justify-between">
					<TOC />
					<div class="flex w-full min-w-0 justify-center">
						<div class="prose mb-16 w-full max-w-3xl min-w-0 px-4 pt-3.5 pb-4">
							{props.children}
						</div>
					</div>
				</div>
			</main>
		</drab-prefetch>
	);
};

const TOC = () => {
	const { pathname } = Context.get().url;

	let result: ReturnType<typeof docs.getContent>;

	if (pathname === "/") {
		result = homeResult;
	} else {
		result = docs.getContent(pathname.slice(1));
		if (!result) return;
	}

	return (
		<div>
			<aside class="sticky top-0 hidden min-w-52 flex-col gap-3 p-4 lg:flex">
				<h2 class="pl-3 text-xs uppercase">
					<a href="#" class="text-muted-foreground font-bold">
						On this page
					</a>
				</h2>
				<ul class="grid gap-1">
					{result.headings.map((heading) => {
						if (heading.level !== 2) return;

						return (
							<li>
								<a
									class="button ghost text-muted-foreground h-8 justify-start truncate px-3 capitalize"
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
		<a href="/" class="pl-2 text-lg font-bold no-underline">
			ovr
		</a>
	);
};

const NavHeading = (props: { children: JSX.Element }) => {
	return (
		<h2 class="text-muted-foreground pl-2 text-xs font-bold uppercase">
			{props.children}
		</h2>
	);
};

const NavList = () => {
	return (
		<>
			<hr />

			<NavHeading>Docs</NavHeading>
			<ul class="grid gap-1">
				{docs.getSlugs().map((slug) => {
					return <NavLink slug={slug} />;
				})}
				<NavLink slug={docs.llms.pathname().slice(1)} />
			</ul>

			<hr />

			<NavHeading>Demo</NavHeading>
			<ul class="grid gap-1">
				{Object.values(demos)
					.sort((a, b) => a.pattern.localeCompare(b.pattern))
					.map((demo) => {
						if (!("Anchor" in demo)) return; // filter out post

						return (
							<li>
								<demo.Anchor
									data-no-prefetch
									class={clsx(
										"button secondary justify-start capitalize",
										demo.pattern !== Context.get().url.pathname && "ghost",
									)}
								>
									{demo.pattern.split("/").at(2)}
								</demo.Anchor>
							</li>
						);
					})}
			</ul>

			<hr />

			<ul>
				<li>
					<a
						href="https://github.com/rossrobino/ovr"
						target="_blank"
						class="button ghost icon"
						aria-label="GitHub"
					>
						<span class="icon-[lucide--github]"></span>
					</a>
				</li>
			</ul>
		</>
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
				{props.slug.split("-").slice(1).join(" ") ||
					props.slug.split(".").at(0)}
			</a>
		</li>
	);
};
