import { md } from "@robino/md";
import langBash from "@shikijs/langs/bash";
import langTsx from "@shikijs/langs/tsx";
import { domco } from "domco";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		domco(),
		md({
			highlighter: {
				langs: [langTsx, langBash],
				langAlias: { js: "tsx", ts: "tsx", jsx: "tsx" },
			},
		}),
	],
});
