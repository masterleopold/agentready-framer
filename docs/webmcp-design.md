# WebMCP design notes

AgentReady follows the Chrome WebMCP origin-trial API as a progressive enhancement. The published Framer page remains fully usable when `document.modelContext` is unavailable.

## API choice

- Use the imperative API for Framer canvas components, ARIA widgets, multi-step state, chat, CMS snapshots, Shopify, and Cloudflare integrations.
- Prefer declarative `toolname`, `tooldescription`, and `toolparamdescription` annotations for simple native HTML forms owned by the site author.
- Do not register both a declarative form tool and an imperative tool with the same purpose. Overlapping tools reduce selection reliability.
- Keep registration capability-scoped and page-state-aware. Form and conversation tools are registered only when their corresponding UI exists.
- Register through an `AbortController` so republishing or reinitializing the runtime cleanly removes the prior tool set.
- Direct mode is fully browser-local. Hybrid reserves network-backed names for Cloudflare's Site MCP Server pack and leaves page-state actions local. Bridge mode leaves all registration to Cloudflare.

## Cloudflare composition

Cloudflare's Developer Preview injects the same-origin `/.webmcp/bridge.js` at the edge and composes selected packs into `document.modelContext`. AgentReady's Site MCP Server is therefore routed at the Framer custom domain's `/mcp`, not called through a cross-origin Worker URL. It supports MCP initialize, list, and call while rejecting cross-site browser requests and exposing no administrator tools.

The gateway is appropriate for AI Search, provenance hashing, Shopify catalog/policy reads, payment-challenge discovery, and paid-content discovery. DOM inspection, form manipulation, conversational state, Shopify cart session state, and checkout handoff remain in the page. The optional Content Credentials pack is useful provenance metadata, but its current `signatureVerified: false` output must not be described as signature verification.

## Tool contract

- Names are short action-oriented identifiers and each tool has one purpose.
- Inputs use explicit JSON Schema types, enums, ranges, and `additionalProperties: false`.
- Runtime code still validates origins, sensitive fields, payment boundaries, and current DOM state because schema constraints are not a security boundary.
- Read-only tools use `readOnlyHint`; outputs containing page, CMS, chat, catalog, or other external content use `untrustedContentHint`.
- Network operations should receive the execution `AbortSignal` and pass it to `fetch`.
- Outputs should be concise. Large paid content is returned by the structured JSON endpoint, not copied into a WebMCP tool result.

## Human visibility and control

Tool execution updates the same visible Framer interface a person uses. Prefill, cart, navigation, and chat actions do not run in a hidden parallel UI. AgentReady focuses or scrolls the affected control and returns whether review is required.

Passwords, OTPs, payment credentials, wallet authentication, secure file selection, CAPTCHA, and final purchase confirmation stay with the person. Payment-capable agents use their own scoped Cloudflare credentials outside Framer.

## Browser constraints

- Chrome currently requires origin isolation and a `tools` Permissions Policy; cross-origin frames are excluded unless explicitly delegated with `allow="tools"` and an `exposedTo` allowlist.
- Clients must visit a page before discovering its tools.
- WebMCP targets local, human-in-the-loop browser workflows; it is not a replacement for a remote crawler API.
- The API is experimental and can change during the origin trial, so AgentReady keeps generation isolated in `src/runtime.ts`.

References: [Chrome WebMCP](https://developer.chrome.com/docs/ai/webmcp), [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api), [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices), [tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools), and [Cloudflare WebMCP](https://blog.cloudflare.com/webmcp/).
