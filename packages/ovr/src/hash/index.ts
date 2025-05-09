// Fast hashing algorithm http://www.cse.yorku.ca/~oz/hash.html
// Adapted from SvelteKit https://github.com/sveltejs/kit/blob/25d459104814b0c2dc6b4cf73b680378a29d8200/packages/kit/src/runtime/hash.js

export const hash = (s: string) => {
	let hash = 5381;

	let i = s.length;
	while (i) hash = (hash * 33) ^ s.charCodeAt(--i);

	return (hash >>> 0).toString(36);
};
