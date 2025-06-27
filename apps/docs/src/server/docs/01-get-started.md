---
title: Get Started
description: Getting started with ovr
---

## Installation

Install the `ovr` package from npm using your preferred package manager.

```bash
npm i ovr
```

Alternatively, you can setup ovr with a pre-configured template using [Vite with domco](https://github.com/rossrobino/domco). This includes live reload and options for Tailwind, deployment adapters, and more.

```bash
npx create-domco@latest --framework=ovr
```

## JSX

To utilize JSX, add the following options to your `tsconfig.json` to enable the JSX transform. TypeScript, Vite, or esbuild will pickup the option from this file.

```json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "ovr" } }
```

Or you can use a comment if you are using ovr in conjunction with another framework to specify the import source for a specific module where you are using ovr.

```tsx
/** @jsx jsx */
/** @jsxImportSource ovr */
```

## Compatibility

ovr can be used in any Fetch API compatible runtime via [`app.fetch`](/03-app#fetch). Here are a few ways to create a Fetch based HTTP server in various JavaScript runtimes.

- [Node + srvx](https://srvx.h3.dev/)
- [Cloudflare Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/get-started/)
- [Bun HTTP server](https://bun.sh/docs/api/http)
- [Deno HTTP server](https://docs.deno.com/runtime/fundamentals/http_server/)

For example, using `srvx` you can plug `app.fetch` into the `serve` [options](https://srvx.h3.dev/guide/handler).

```tsx
// src/index.tsx
import { App } from "ovr";
import { serve } from "srvx";

const app = new App();

app.get("/", () => <h1>Hello World</h1>);

serve({ fetch: app.fetch });
```

Then can compile `tsx` into `js` with TypeScript, and run the server with Node.

```bash
tsc && node dist/index.js
```
