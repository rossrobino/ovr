import fs from "node:fs/promises";
import { build } from "rolldown";

const result = await build({
	input: "entry.js",
	output: { format: "esm", minify: true },
});

const kb = Math.round(result.output[0].code.length / 10) / 100;

console.log({ kb });

await fs.writeFile("src/index.js", `export const kb = ${kb}`);
