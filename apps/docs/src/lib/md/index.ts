import { codeControls } from "./code-controls";
import { externalLink } from "./external-link";
import { type Options, Processor } from "@robino/md";
import langBash from "shiki/langs/bash.mjs";
import langHtml from "shiki/langs/html.mjs";
import langJson from "shiki/langs/json.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import * as z from "zod/v4-mini";

export const options: Options = {
	highlighter: {
		langs: [langBash, langTsx, langJson, langHtml],
		langAlias: { ts: "tsx", js: "tsx", jsx: "tsx" },
	},
	plugins: [codeControls, externalLink],
};

export const processor = new Processor(options);

export const FrontmatterSchema = z.object({
	title: z.string(),
	description: z.string(),
});
