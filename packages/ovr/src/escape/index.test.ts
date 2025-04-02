import { escape } from "./index.js";
import { expect, test } from "vitest";

test("escape content", () => {
	const escaped = escape(`&<script>console.log("hello")</script>`);

	expect(escaped.includes("&amp")).toBe(true);
	expect(escaped.includes("<")).toBe(false);
});

test("escape attribute", () => {
	const escaped = escape(`&<script>console.log("hello")</script>`, true);

	expect(escaped.includes("&amp")).toBe(true);
	expect(escaped.includes("<")).toBe(false);
	expect(escaped.includes('"')).toBe(false);
});
