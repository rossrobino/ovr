declare module "*.md" {
	import type { Heading, Result } from "@robino/md";
	import type { FrontmatterSchema } from "@/lib/md";

	export const html: string;
	export const article: string;
	export const headings: Heading[];
	export const frontmatter: Result<typeof FrontmatterSchema>["frontmatter"];
}
