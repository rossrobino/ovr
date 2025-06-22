---
title: Routing
description: Trie-based routing in ovr.
---

ovr's router offers efficient and fast route matching, supporting static paths, parameters, and wildcards. Utilizing a [trie](https://en.wikipedia.org/wiki/Radix_tree) structure means that performance does not degrade as you add more routes.

The router is forked and adapted from [memoirist](https://github.com/SaltyAom/memoirist) and [@medley/router](https://github.com/medleyjs/router).

## Parameters

Create a parameter for a route using the colon before a path segment. `/api/:id` will create a `params` object on the `Context` with a property of `id` containing the actual path segment requested.

```ts
// Params
app.post("/api/:id", (c) => {
	// matches "/api/123"
	c.params; // { id: "123" }
});
```

## Wildcard

Use an asterisk `*` to match all remaining segments in the route.

```ts
app.get("/files/*", (c) => {
	c.params["*"]; // matched wildcard path (e.g., "images/logo.png")
});
```

## Prioritization

Routes are prioritized in this order:

**Static > Parametric > Wildcard**

Given three routes are added in any order:

```ts
trie.add(new Route("/hello/world", "store"));
trie.add(new Route("/hello/:name", "store"));
trie.add(new Route("/hello/*", "store"));
```

More specific matches are prioritized. The following pathnames would match the corresponding patterns:

| Pathname            | Pattern        |
| ------------------- | -------------- |
| `/hello/world`      | `/hello/world` |
| `/hello/john`       | `/hello/:name` |
| `/hello/john/smith` | `/hello/*`     |

## Create your own router

`App` is built using the `Trie` and `Route` classes. You don't need to access these if you are using `App`, but you can build your own router using the them.

```ts
import { Route, Trie } from "ovr";

// specify the type of the store in the generic
const trie = new Trie<string>();
const route = new Route("/hello/:name", "store");

trie.add(route);

const match = trie.find("/hello/world"); // { route, params: { name: "world" } }
```
