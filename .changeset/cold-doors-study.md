---
"ovr": patch
---

fix: Prevent event loop blocking during large HTML generation

Added periodic event loop yielding to prevent blocking when generating large amounts of HTML. This ensures streaming chunks are properly flushed to the browser even when processing thousands of elements.

Previously, generating large HTML structures (like tables with many rows) could block the event loop, causing the browser to stop receiving chunks mid-stream. The page would appear to load partially then hang, especially noticeable with datasets over 1000+ items.

Now ovr automatically yields control back to the event loop periodically, allowing the streaming response to flush chunks consistently throughout the generation process.
