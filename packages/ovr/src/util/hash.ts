/**
 * Fast hashing algorithm - [djb2](http://www.cse.yorku.ca/~oz/hash.html)
 *
 * @param s String to hash
 * @returns Hashed string
 */
export const hash = (s: string) => {
	let hash = 5381;
	let i = s.length;

	while (i) hash = (hash * 33) ^ s.charCodeAt(--i);

	return (hash >>> 0).toString(36);
};
