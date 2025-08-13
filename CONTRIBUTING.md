# Contributing to ovr

ovr is open source with the MIT license. Feel free to create an issue on GitHub if you have an idea for the project to get feedback before working on a pull request.

## Local development

1. Fork the project on GitHub
2. The project requires Node and npm for development
3. Install dependencies from the root directory `npm install`
4. Start the TypeScript and Vite development servers together by running `npm run dev` from the root directory.

## Conventions

- Casing - try to match built-in JS methods/casing whenever possible
  - Variables including constants are camelCase
  - Classes and types are PascalCase
  - File names are kebab-case
- Prefer arrow functions over the `function` keyword.
- Web standard APIs are exposed publicly, not Node.
  - For example, the `Request` is exposed within `Context` as the web standard request not the Node version.
- Node APIs can be used privately if needed they are supported across Deno, Bun, and Cloudflare.
  - For example, `setImmediate` is faster than `setTimeout` and is used internally.
