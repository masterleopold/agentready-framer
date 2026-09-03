# Request coverage audit

This is the implementation audit against the product requirements for AgentReady. “Implemented” means code and automated coverage exist in this repository. “External setup” means the integration is implemented but cannot be made live without an account, secret, product, zone, or marketplace approval owned by the operator.

## Product and distribution

| Requirement | Status | Evidence / boundary |
| --- | --- | --- |
| No-code WebMCP Builder for Framer | Implemented | Workspace Plugin scans the active canvas and CMS, exposes capability switches, and installs generated Custom Code |
| Framer-like visual design and typography | Implemented | Responsive dark Framer-style demo and native-feeling plugin UI; decorative header icons removed |
| Public source and installable package | Implemented | GitHub repository, `npm run build`, and `npm run pack` |
| Framer Marketplace distribution | External setup | Package is ready; publication requires Framer review and owner submission |
| Self-host plugin UI on Vercel or Cloudflare | Implemented | Static `dist` is deployable while optional Workers remain separate services |
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
| Shopify catalog, cart, order preparation, and checkout | Implemented with external setup | Storefront search; cart create/read/update; buyer, discount, note, quantity; secure Shopify Checkout handoff. Store domain/token and products are required |
| Credit-card and payment form support | Safe preparation implemented | contact, address, shipping, coupon, plan, and quantity can be prepared; PAN/CVV/bank credentials and final payment stay human-only |
| Cloudflare Agentic Payments | Implemented with external setup | Three MPP offers, HTTP 402 challenges, receipt exposure, abortable calls. Worker URL and payment secrets are required |
| Cloudflare Pay Per Crawl | Implemented with external setup | price/purpose discovery, `crawler-*` headers, structured JSON response, schema, digest, license, and provenance. An enrolled Cloudflare zone is required for enforcement/billing |
| Paid JSON content contract | Implemented | `/.well-known/agentready.json`, `/agentready/schema.json`, and `/agentready/content.json` |
| Crawler governance evidence | Implemented as metadata | source, timestamp, digest, payment headers, license, and request ID; these records are not a universal copyright license |
| Cloudflare storage and abuse controls | Implemented with external setup | Durable Objects, Turnstile, and R2 human-selected upload handoff |
| Cloudflare AI Search knowledge | Implemented with external setup | Browser Run renders allowlisted Framer URLs; an administrator-only sync route uploads Markdown with source, digest, retrieval time, and license metadata; three public WebMCP tools provide search, cited answers, and provenance |
| Cloudflare AI Gateway chatbot path | Implemented with external setup | Optional OpenAI-compatible gateway URL/model/token generates grounded answers from retrieved AI Search chunks; secrets remain Worker-only |
| WebMCP analytics | Implemented with external setup | Analytics Engine records only origin, tool name, success/error, anonymous session hash, duration, and count; arguments and returned content are excluded |
| Browser Run readiness verification | Implemented with external setup | Administrator-only snapshot verifies HTTPS, installed Custom Code, rendered content, accessibility tree, forms, and headings for allowlisted origins |

## WebMCP conformance and verification

- Imperative tools are registered from top-level page JavaScript with narrow JSON Schemas.
- Tools are registered only when their capability and relevant UI/configuration are present.
- Read-only, open-world, destructive, and untrusted-content annotations are applied by behavior.
- Generated runtime data is escaped against script termination and prototype-pollution-style arguments are rejected.
- Hidden Framer breakpoint duplicates and inactive steps are excluded.
- Async network and chat operations accept the WebMCP execution cancellation signal.
- Sensitive values are never returned, filled, persisted, or placed in tool arguments.
- Isolated tests exercise all 28 optional tools; live tests execute the runtime installed in Framer Custom Code.
- CI verifies the plugin, runtime, package, Cloudflare TypeScript, and all four Worker bundles.

## Remaining launch inputs

These are operational dependencies rather than missing product code:

1. Add real Shopify Storefront credentials and AgentReady variants, or a real HTTPS hosted checkout URL with actual terms/refund/privacy pages.
2. Add Cloudflare MPP secrets, deploy the payment Worker, and configure its public endpoint in the plugin/demo.
3. Enroll the production zone in Pay Per Crawl, deploy the crawl Worker/route, and replace the example license URL.
4. Configure Turnstile and R2 if the optional upload handoff is demonstrated.
5. Create the AI Search instance/namespace and Analytics Engine dataset, deploy the intelligence Worker, set its admin secret, and optionally configure an AI Gateway chat endpoint.
6. Submit the packed plugin for Framer Marketplace review.
7. Record the demo video and complete the Devpost submission before the official deadline.
