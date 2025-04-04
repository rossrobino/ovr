import { Bench } from "./index.js";
import { run, bench, boxplot, summary } from "mitata";
import { toString } from "ovr";

boxplot(() => {
	summary(() => {
		bench("basic", async () => {
			await toString(Bench);
		}).gc("inner");
	});
});

await run();
