import type { FrontmatterSchema } from "@/lib/md";
import type { Result } from "@robino/md";

export const content = import.meta.glob<Result<typeof FrontmatterSchema>>(
	`@/content/*.md`,
	{ eager: true },
);

export const getSlugs = () => {
	return Object.keys(content).map((path) => {
		let slug = path.split("/").at(2)?.split(".").at(0)!;
		if (slug === "index") slug = "";
		return slug;
	});
};
