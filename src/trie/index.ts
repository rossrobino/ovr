export class Route<Store> {
	/** Route pattern */
	pattern: string;

	/** Store returned when route is found */
	store: Store;

	constructor(pattern: string, store: Store) {
		if (pattern[0] !== "/") {
			throw new Error(
				`Invalid route: ${pattern} - route pattern must begin with "/"`,
			);
		}

		this.pattern = pattern;
		this.store = store;
	}
}

class ParamNode<Store> {
	/** Name of the parameter (without the colon ":") */
	name: string;

	/** Matched route */
	route: Route<Store> | null = null;

	/** Static child node */
	staticChild: Node<Store> | null = null;

	constructor(name: string) {
		this.name = name;
	}
}

export class Node<Store> {
	/** Unique segment of the pattern trie */
	segment: string;

	/** Static child node map, key is the first character in the segment */
	staticMap: Map<number, Node<Store>> | null = null;

	/** Parametric child node */
	paramChild: ParamNode<Store> | null = null;

	/** Matched route */
	route: Route<Store> | null = null;

	/** Matched wildcard route */
	wildcardRoute: Route<Store> | null = null;

	/**
	 * @param segment pattern segment
	 * @param staticChildren static children nodes to add to staticMap
	 */
	constructor(segment = "/", staticChildren?: Node<Store>[]) {
		this.segment = segment;

		if (staticChildren?.length) {
			this.staticMap ??= new Map();

			for (const child of staticChildren) {
				this.staticMap.set(child.segment.charCodeAt(0), child);
			}
		}
	}

	/**
	 * @param segment new segment
	 * @returns a clone of the Node with a new segment
	 */
	clone(segment: string) {
		const clone = new Node(segment);

		clone.staticMap = this.staticMap;
		clone.paramChild = this.paramChild;
		clone.route = this.route;
		clone.wildcardRoute = this.wildcardRoute;

		return clone;
	}

	/**
	 * If the current segment is "api/posts/"
	 * and "api/movies/" is added,
	 * the node will need to be reassigned to "api/" and create two static children.
	 *
	 * @param charIndex	where to split the node
	 * @param segment new segment to use
	 * @returns the new child produced from the new segment
	 */
	fork(charIndex: number, segment: string) {
		const existingChild = this.clone(this.segment.slice(charIndex)); // "posts/"
		const newChild = new Node<Store>(segment.slice(charIndex)); // "movies/"

		Object.assign(
			this,
			// "api/" with the above as children
			new Node(this.segment.slice(0, charIndex), [existingChild, newChild]),
		);

		return newChild;
	}

	/**
	 * node.segment = "static/static",
	 * staticSegment = "static/",
	 * then the node needs to be split to accommodate the shorter segment
	 *
	 * @param segment
	 */
	split(segment: string) {
		const secondHalf = this.clone(this.segment.slice(segment.length));

		Object.assign(this, new Node(segment, [secondHalf]));
	}

	/**
	 * @param name name of the param
	 * @returns the existing child with the same name, or creates a new
	 */
	setParamChild(name: string) {
		if (this.paramChild && this.paramChild.name !== name) {
			throw new Error(
				`Cannot create parameter "${name}" because a different parameter ` +
					`("${this.paramChild.name}") already exists in this location.\n\n${this}`,
			);
		}

		return (this.paramChild ??= new ParamNode<Store>(name));
	}

	/**
	 * @param route route return when pattern is matched
	 * @returns this - the Node
	 */
	add(route: Route<Store>) {
		let current: Node<Store> = this;
		let pattern = route.pattern; // created to not modify the original

		const endsWithWildcard = pattern.endsWith("*");
		if (endsWithWildcard) pattern = pattern.slice(0, -1);

		const paramSegments = pattern.match(/:.+?(?=\/|$)/g) ?? []; // match the params
		const staticSegments = pattern.split(/:.+?(?=\/|$)/); // split on the params

		// if the last segment is a param without a trailing slash
		// then there will be an empty string, remove
		if (staticSegments.at(-1) === "") staticSegments.pop();

		let paramIndex = 0;
		// for each static segment, if there are no static segments, this is skipped
		for (
			let staticIndex = 0;
			staticIndex < staticSegments.length;
			staticIndex++
		) {
			let staticSegment = staticSegments[staticIndex]!;

			if (staticIndex > 0) {
				// there is only a second static segment (could just be "/")
				// if there is a param to split them, so there must be a param here

				const paramChild = current.setParamChild(
					// param without the ":" (only increment when this is reached)
					paramSegments[paramIndex++]!.slice(1),
				);

				if (!paramChild.staticChild) {
					// new - create node with the next static segment
					current = paramChild.staticChild = new Node<Store>(staticSegment);
					continue; // next segment - no need to check since it's new
				}

				// there's already a static child - need to check if it's a match
				current = paramChild.staticChild;
			}

			// check if the staticSegment matches the current node
			for (let charIndex = 0; ; ) {
				if (charIndex === staticSegment.length) {
					// finished iterating through the staticSegment
					if (charIndex < current.segment.length) {
						// too short
						current.split(staticSegment);
					}

					break; // next segment
				}

				if (charIndex === current.segment.length) {
					// passed the end of the current node
					if (!current.staticMap) {
						// new pattern, create new leaf
						current.staticMap = new Map();
					} else {
						// there's already static children,
						// check to see if there's a leaf that starts with the char
						const staticChild = current.staticMap.get(
							staticSegment.charCodeAt(charIndex),
						);

						if (staticChild) {
							// re-run loop with existing staticChild
							current = staticChild;
							staticSegment = staticSegment.slice(charIndex);
							charIndex = 0;
							continue;
						}
					}

					// otherwise, add new staticChild
					const staticChild = new Node<Store>(staticSegment.slice(charIndex));
					current.staticMap.set(
						staticSegment.charCodeAt(charIndex),
						staticChild,
					);
					current = staticChild;

					break; // next segment
				}

				if (staticSegment[charIndex] !== current.segment[charIndex]) {
					// different than the node - fork
					current = current.fork(charIndex, staticSegment);

					break; // next segment
				}

				// character is the same - rerun to check next char
				charIndex++;
			}
		}

		if (paramIndex < paramSegments.length) {
			// final segment is a param
			current.setParamChild(paramSegments[paramIndex]!.slice(1)).route ??=
				route;
		} else if (endsWithWildcard) {
			// final segment is a wildcard
			current.wildcardRoute ??= route;
		} else {
			// final segment is static
			current.route ??= route;
		}

		return this;
	}

	/**
	 * @param pathname Path to find
	 * @returns `Route` and the matched `params` if found, otherwise `null`
	 */
	find(pathname: string): {
		route: Route<Store>;
		params: Record<string, string>;
	} | null {
		if (
			// too short
			pathname.length < this.segment.length ||
			// segment does not match current node segment
			!pathname.startsWith(this.segment)
		) {
			return null;
		}

		if (pathname === this.segment) {
			// reached the end of the path
			if (this.route)
				return {
					route: this.route,
					params: {},
				};

			if (this.wildcardRoute)
				return {
					route: this.wildcardRoute,
					params: { "*": "" },
				};

			return null;
		}

		if (this.staticMap) {
			// check for a static leaf that starts with the first character
			const staticChild = this.staticMap.get(
				pathname.charCodeAt(this.segment.length),
			);

			if (staticChild) {
				const result = staticChild.find(pathname.slice(this.segment.length));
				if (result) return result;
			}
		}

		// check for param leaf
		if (this.paramChild) {
			const slashIndex = pathname.indexOf("/", this.segment.length);

			// if there is not a slash immediately following this.segment
			if (slashIndex !== this.segment.length) {
				// there is a valid parameter
				if (
					// param is the end of the pathname
					slashIndex === -1 &&
					this.paramChild.route
				) {
					return {
						route: this.paramChild.route,
						params: {
							[this.paramChild.name]: pathname.slice(this.segment.length),
						},
					};
				} else if (this.paramChild.staticChild) {
					// there's a static node after the param
					// this is how there can be multiple params, "/" in between
					const result = this.paramChild.staticChild.find(
						pathname.slice(slashIndex),
					);

					if (result) {
						// add original params to the result
						result.params[this.paramChild.name] = pathname.slice(
							this.segment.length,
							slashIndex,
						);

						return result;
					}
				}
			}
		}

		// check for wildcard leaf
		if (this.wildcardRoute) {
			return {
				route: this.wildcardRoute,
				params: { "*": pathname.slice(this.segment.length) },
			};
		}

		return null;
	}
}
