import { FrontmatterSchema, options } from "./src/lib/md";
import { adapter } from "@domcojs/vercel";
import { md } from "@robino/md";
import tailwindcss from "@tailwindcss/vite";
import { domco } from "domco";
import { defineConfig } from "vite";

export default defineConfig({
	build: { minify: true },
	plugins: [
		tailwindcss(),
		domco({ adapter: adapter({ config: { runtime: "bun1.x" } }) }),
		md({ ...options, FrontmatterSchema }),
	],
});
