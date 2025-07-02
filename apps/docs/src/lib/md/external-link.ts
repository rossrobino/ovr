import type { PluginSimple } from "markdown-it";
import type MarkdownIt from "markdown-it";

export const externalLink: PluginSimple = (md: MarkdownIt) => {
	const original =
		md.renderer.rules.link_open ?? md.renderer.renderToken.bind(md.renderer);

	md.renderer.rules.link_open = (tokens, i, options, env, self) => {
		const openTokens = tokens.filter((t) => t.type === "link_open");

		for (const open of openTokens) {
			if (open.attrGet("href")?.startsWith("http") && !open.attrGet("target")) {
				open.attrSet("target", "_blank");

				const openIndex = tokens.findIndex((o) => o === open);
				const text = tokens[openIndex + 1];

				if (text?.type === "text") {
					open.attrJoin("class", " inline-flex gap-1 items-center pr-0.5");

					text.type = "html_inline";
					text.content =
						`<span>${text.content}</span>` +
						'<span class="icon-[lucide--external-link] size-3"></span>';
				}
			}
		}

		return original(tokens, i, options, env, self);
	};
};
