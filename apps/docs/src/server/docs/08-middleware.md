---
title: Middleware
description: Built in middleware helpers.
---

## CSRF

Basic [cross-site request forgery (CSRF)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF) protection that checks the request's `method` and `Origin` header. For more robust protection you'll need a stateful server or a database to store [CSRF tokens](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF#csrf_tokens).

```ts
import { csrf } from "ovr";

app.use(csrf({ origin: "https://example.com" }));
```
