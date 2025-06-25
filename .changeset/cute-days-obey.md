---
"ovr": minor
---

feat: Add `pathname` and `Params` to helpers.

Helpers have a two new properties.

```tsx
const get = new Get("/hello/:name", (c) => <h1>Hello {c.params.name}</h1>);
```

### Params

`Params` is a type helper to get the specific params of the route based on the pattern.

```ts
typeof get.Params; // { name: string }
```

### Pathname

The `pathname` method inserts params into the pattern. It provides type safety to ensure you always pass the correct params (or no params) to create the pathname.

```ts
get.pathname({ name: "world" }); // `/hello/${string}`
get.pathname({ name: "world" } as const); // "/hello/world"
```

Using incorrect params results in an error:

```ts
get.pathname({ id: "world" });
// Error: 'id' does not exist in type '{ name: string; }'
```

You can even create a list of exact pathnames for given params.

```ts
const params = [
	{ name: "world" },
	{ name: "ross" },
] as const satisfies (typeof get.Params)[];

const pathnames = params.map((p) => get.pathname(p));

// ("/hello/world" | "/hello/ross")[]
```
