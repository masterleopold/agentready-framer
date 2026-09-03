# Request coverage audit

This is the implementation audit against the product requirements for AgentReady. “Implemented” means code and automated coverage exist in this repository. “External setup” means the integration is implemented but cannot be made live without an account, secret, product, zone, or marketplace approval owned by the operator.

## Product and distribution

| Requirement | Status | Evidence / boundary |
| --- | --- | --- |
| No-code WebMCP Builder for Framer | Implemented | Workspace Plugin scans the active canvas and CMS, exposes capability switches, and installs generated Custom Code |
| Framer-like visual design and typography | Implemented | Responsive dark Framer-style demo and native-feeling plugin UI; decorative header icons removed |
| Public source and installable package | Implemented | GitHub repository, `npm run build`, and `npm run pack` |
| Framer Marketplace distribution | Ready for owner submission | Package, manifest icon, and listing copy are ready; the owner must upload and publish the archive from Framer Community |
| Self-host plugin UI on Vercel or Cloudflare | Implemented | Static `dist` is deployable while optional Workers remain separate services |
| Cloudflare WebMCP edge delivery | Implemented with external setup | Direct/Hybrid/Bridge modes, same-origin `/mcp` Worker, remote/local tool separation, and C2PA pack guidance; Cloudflare zone activation remains external |
| Chrome 149+ Origin Trial onboarding | Implemented with external setup | Plugin stores an optional public, first-party token and installs an escaped `origin-trial` meta element in `headStart`; the site owner must register the exact origin and renew expired tokens |
| Public Framer demo with the plugin installed | Implemented | Live Framer page plus `npm run test:live` |
| Sell AgentReady from its own WebMCP-enabled demo | Implemented with external setup | Tiered checkout UI and tools exist; a real HTTPS checkout URL/product is required to take money |

## Forms, controls, and conversations

| Surface | Status | Supported behavior / boundary |
| --- | --- | --- |
| Text inputs | Implemented | text, search, email, telephone, URL, number, textarea, contenteditable, constraints, and validation state |
| Options | Implemented | select, datalist, multi-select, radio, checkbox, ARIA listbox/option, combobox, switch, toggle, pressed button, and tabs |
| Numeric controls | Implemented | number, quantity, range/slider, and spinbutton |
| Date and time | Implemented | date, time, datetime-local, month, week, date ranges, accessible calendar grids, and timezone context |
| Address | Implemented | recipient, organization, address lines, city, region, postal code, country, email, phone, and shipping/billing scopes |
| Multi-step and conditional forms | Implemented | inspect current step, Next/Back navigation, visible-field filtering, and value preservation |
| File, image, and camera input | Safe handoff implemented | reports accepted types/multiplicity and opens the browser picker; the agent cannot select a local file |
| Chatbot UI | Implemented | read both sides of the conversation, compose input, optionally send, wait for replies, and cancel waiting |
| Generic form submission | Implemented, opt-in | validation plus explicit submission tool; payment/auth/sensitive forms are refused |
| Password, OTP, bank, and card fields | Intentionally human-only | values are redacted and writes are blocked |
| CAPTCHA, passkeys, biometrics, wallets, 3-D Secure, signatures | Intentionally human-only | agents may prepare surrounding data but cannot bypass proof, consent, or final authorization |

## Commerce and Cloudflare

| Requirement | Status | Evidence / boundary |
| --- | --- | --- |
| Shopify catalog, cart, order preparation, and checkout | Implemented and connected in the live demo | Official Storefront MCP/UCP discovery against `tkigey-1f.myshopify.com`; localized catalog search; batch product/variant lookup; interactive option narrowing; merchant policies/FAQ; cart create/read/update; secure Shopify Checkout handoff; browser-safe Cloudflare proxy for standard MCP; automatic GraphQL fallback. All seven Shopify tools are counted in the live 30-tool runtime |
| Credit-card and payment form support | Safe preparation implemented | contact, address, shipping, coupon, plan, and quantity can be prepared; PAN/CVV/bank credentials and final payment stay human-only |
| Cloudflare Agentic Payments | Implemented with external setup | Three one-time MPP offers, HTTP 402 challenge/retry instructions, unique verified order and entitlement IDs, no-store responses, receipt evidence, and abortable calls. Worker URL, recipient, currency, signing secret, and reviewed testnet/mainnet selection are required |
| Cloudflare Pay Per Crawl | Implemented with external setup | price/purpose discovery, `crawler-*` headers, structured JSON response, schema, digest, license, and provenance. An enrolled Cloudflare zone is required for enforcement/billing |
| Paid JSON content contract | Implemented | `/.well-known/agentready.json`, `/agentready/schema.json`, and `/agentready/content.json` |
| Crawler governance evidence | Implemented as metadata | source, timestamp, digest, payment headers, license, and request ID; these records are not a universal copyright license |
| Cloudflare storage and abuse controls | Implemented with external setup | Durable Objects, Turnstile, and R2 human-selected upload handoff |
| Cloudflare AI Search knowledge | Implemented with external setup | Browser Run renders allowlisted Framer URLs; an administrator-only sync route uploads Markdown with source, digest, retrieval time, and license metadata; three public WebMCP tools provide search, cited answers, and provenance |
| Cloudflare AI Gateway chatbot path | Implemented with external setup | Optional OpenAI-compatible gateway URL/model/token generates grounded answers from retrieved AI Search chunks; secrets remain Worker-only |
| WebMCP analytics | Implemented with external setup | Analytics Engine records only origin, tool name, success/error, anonymous session hash, duration, and count; arguments and returned content are excluded |
| Browser Run readiness verification | Implemented with external setup | Administrator-only snapshot verifies HTTPS, AgentReady Custom Code or Cloudflare's injected bridge, rendered content, accessibility tree, forms, and headings for allowlisted origins |
| Content Credentials / C2PA | Implemented with external setup | Plugin configures the expected Cloudflare pack surface and documents its boundary; the current preview decodes metadata but reports `signatureVerified: false` |

## WebMCP conformance and verification

- Imperative tools are registered from top-level page JavaScript with narrow JSON Schemas.
- Tools are registered only when their capability and relevant UI/configuration are present.
- Declarative forms carrying `toolname` are excluded from imperative form discovery; active/cancel events and Chrome's declarative pseudo-classes receive visible runtime support.
- Every tool has a user-facing title; only the currently standardized `readOnlyHint` and `untrustedContentHint` WebMCP annotations are forwarded. Review, refusal, and consequential-action policy stays in explicit tool contracts until the related proposals are standardized.
- Chrome secure-tool budgets are enforced at registration and execution: 30-character names, 500-character tool descriptions, 150-character parameter descriptions, and 1,500-character JSON results. Oversized results return retryable narrowing guidance.
- Generated runtime data is escaped against script termination and prototype-pollution-style arguments are rejected.
- Hidden Framer breakpoint duplicates and inactive steps are excluded.
- Async network and chat operations accept the WebMCP execution cancellation signal.
- Registration Promises are observed and summarized; tool names are validated against the specification grammar.
- Safe current form values and validation state are returned, while payment/sensitive confirmation controls are marked human-only and reject untrusted synthetic activation.
- Sensitive values are never returned, filled, persisted, or placed in tool arguments.
- Hybrid mode reserves gateway-backed names so the Cloudflare bridge and local runtime never register duplicate tools.
- The gateway enforces same-origin browser access, bounded JSON-only JSON-RPC, configuration-filtered tools, and no public admin methods.
- Isolated tests exercise all 30 optional tools; live tests execute the runtime installed in Framer Custom Code.
- CI verifies the plugin, runtime, package, Cloudflare TypeScript, gateway behavior, and all five Worker bundles.

## Remaining launch inputs

These are operational dependencies rather than missing product code:

1. Add reviewed terms/refund/privacy pages to the connected Shopify store. The active AgentReady product and its Creator, Studio, and Agency variants are public and discoverable through Shopify's native UCP catalog as well as tokenless Storefront GraphQL fallback; a public Storefront token is only needed if that fallback stops working.
2. Add Cloudflare MPP secrets, deploy the payment Worker, and configure its public endpoint in the plugin/demo.
3. Enroll the production zone in Pay Per Crawl, deploy the crawl Worker/route, and replace the example license URL.
4. Configure Turnstile and R2 if the optional upload handoff is demonstrated.
5. Create the AI Search instance/namespace and Analytics Engine dataset, deploy the intelligence Worker, set its admin secret, and optionally configure an AI Gateway chat endpoint.
6. Route the MCP gateway at the Framer custom domain's `/mcp`, enable Cloudflare Agent Readiness → WebMCP, and select the Site MCP Server and optional Content Credentials packs.
7. Upload the packed plugin with the prepared listing media and publish it from Framer Community.
8. Record the demo video and complete the Devpost submission before the official deadline.
9. Register the final published origin in Chrome's WebMCP origin trial, install the token with AgentReady, and verify it plus the registered tools in Chrome DevTools or the Model Context Tool Inspector.
