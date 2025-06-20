import type { FrontmatterSchema } from "@/lib/md";
import type { Result } from "@robino/md";

export const content = import.meta.glob<Result<typeof FrontmatterSchema>>(
	`@/content/*.md`,
	{ eager: true },
);
