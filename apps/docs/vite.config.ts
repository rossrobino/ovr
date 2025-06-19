import { adapter } from "@domcojs/vercel";
import { md } from "@robino/md";
import langBash from "@shikijs/langs/bash";
import langTsx from "@shikijs/langs/tsx";
import tailwindcss from "@tailwindcss/vite";
import { domco } from "domco";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		domco({ adapter: adapter() }),
		md({
			highlighter: {
				langs: [langTsx, langBash],
				langAlias: { js: "tsx", ts: "tsx", jsx: "tsx" },
			},
		}),
	],
});
