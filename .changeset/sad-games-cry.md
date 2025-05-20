---
"ovr": major
---

feat: Return `JSX.Element` or a `Response` from middleware

This is breaking, if you were returning something random from middleware before it will now be used.
