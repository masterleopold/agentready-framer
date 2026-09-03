# Title

AgentReady for Framer

## One-line Summary

Turn any Framer site into a safe action surface that people and AI agents can use together.

## Problem

Framer lets designers publish polished websites without writing application code, but those sites still present actions primarily as pixels, text, and DOM structure. Browser agents must infer what a control means, which fields belong together, and where a consequential action begins. Adding WebMCP manually requires JavaScript, JSON Schema, browser-security knowledge, and repeated integration work that most no-code creators should not need to learn.

## Solution

AgentReady is a no-code WebMCP Builder that runs as a Framer Workspace Plugin. It scans the active Framer project, turns pages, CMS content, forms, conversations, commerce, and selected Cloudflare services into explicit capabilities, and installs a typed imperative WebMCP runtime through Framer Custom Code. The owner chooses what agents may do; the published site preserves the same visible human interface while exposing safer, more reliable actions to compatible agents.

## Why This Matters

AgentReady makes agent-native interaction available to the large no-code web-creation audience. A creator can publish a site once and let a person and an agent share the same live page and session: the agent can discover content, prepare complex inputs, continue a support conversation, or assemble a cart, while the person remains responsible for files, credentials, submission, and payment confirmation.

## How We Used AI

AgentReady is infrastructure for AI agents rather than a prompt wrapper. Its 30 browser tools give agents narrow, typed operations for search, CMS lookup, navigation, advanced forms, chat, checkout preparation, Shopify Storefront MCP/UCP commerce, Cloudflare Agentic Payments discovery, paid structured content, cited knowledge, and provenance. Each tool returns bounded, inspectable results and uses explicit human handoffs for sensitive or irreversible actions.

The optional Cloudflare intelligence path can ground answers in an AI Search index and return source citations and content digests. Retrieved page, CMS, chat, catalog, and knowledge content is marked untrusted before it reaches the agent.

## How We Used Codex

Codex was used throughout product design, implementation, and verification: researching the evolving WebMCP specification and Chrome security guidance; designing the capability and safety model; building the Framer plugin and generated runtime; creating Cloudflare Worker integrations; connecting Shopify's Storefront MCP/UCP interfaces; refining the Framer-like UI; and writing automated conformance, gateway, live-site, and deployment tests. The public commit history records this work during the challenge period.

## Key Features

- Framer-native project and CMS scan with no-code capability switches
- 30 optional imperative WebMCP tools registered from top-level page JavaScript
- Text, number, address, checkbox, radio, select, multi-select, date/time, accessible calendar, and multi-step form preparation
- Human-mediated file selection and explicit form-submission boundary
- Read, compose, send, wait, and follow up in visible chatbot conversations
- Shopify product, variant, policy, cart, and hosted-checkout handoff through Storefront MCP/UCP
- Cloudflare Agentic Payments challenge discovery without exposing payment credentials
- Pay Per Crawl structured JSON, license, digest, and provenance contracts
- Optional Cloudflare AI Search, cited answers, analytics, Browser Run verification, R2, Turnstile, and Content Credentials integration
- Direct, Hybrid, and Cloudflare Bridge delivery modes with duplicate-safe registration

## Architecture

The Framer Workspace Plugin scans the current project and generates an escaped runtime configuration. Framer installs the runtime as one Custom Code block, so `document.modelContext.registerTool()` executes in the top-level published page rather than an iframe. Direct mode keeps page-state actions in the browser. Hybrid mode keeps UI actions local while routing selected network-backed capabilities through a same-origin Cloudflare MCP gateway. Shopify owns checkout and payment authentication; Cloudflare Workers keep service credentials and administration outside Framer and outside WebMCP arguments.

## Testing Instructions

### Primary judge path: ChatGPT

1. Install or update the ChatGPT desktop app.
2. Select GPT-5.6 Sol or GPT-5.6 Terra.
3. Enable **Settings → Browser → Permissions → Enable site tools**.
4. Open `https://agentready.framer.website/?judge=20260904` in ChatGPT's in-app browser.
5. Open **Site tools → Available site tools** and confirm that 30 tools are available.
6. Ask: `Use search_site to find the AgentReady purchase section.`
7. Ask: `Use inspect_forms, then prefill_form with name Demo Agent and email agent@example.com. Do not submit.`
8. Ask: `Search Shopify for AgentReady, compare the three plans, add Studio to the cart, and stop before checkout.`

Expected result: the agent finds the purchase section, inspects and visibly prepares the form without sending it, discovers the live AgentReady product and three plans, and prepares a cart while leaving checkout and payment confirmation to the person.

### Alternate judge path: Chrome

Use Chrome 149 or later, enable `chrome://flags/#enable-webmcp-testing`, restart Chrome, and open the same live URL. Inspect `window.__agentReadyRegistration`; it should report `ready: true`, 30 successful registrations, and no failures.

### Repository validation

Run `npm install`, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:demo`, `npm run build`, and `npm run pack`. Run the deployed check with `AGENTREADY_DEMO_URL=https://agentready.framer.website AGENTREADY_STRICT_INSTALLATION=1 npm run test:live`.

No login is required for the live demo. Never enter real card, bank, password, OTP, wallet, or other secret information. Do not complete a purchase during judging.

## Public Demo Link

https://agentready.framer.website

## Public Repository Link

https://github.com/masterleopold/agentready-framer

## Demo Video

TODO: Add the public YouTube URL. The final video must be under three minutes and include audio.

Proposed sequence:

- 0:00–0:20 — Show the Framer/agent interaction problem
- 0:20–0:50 — Scan the site and choose capabilities in the plugin
- 0:50–1:10 — Install tools and publish through Framer
- 1:10–2:15 — Use Site tools in ChatGPT to search, prepare a form, and build a Shopify cart
- 2:15–2:45 — Show the human handoff and Cloudflare/Shopify architecture
- 2:45–2:58 — Close with the product vision

## Screenshot Shot List

1. AgentReady plugin scanning the live Framer project
2. Capability switches and the 30-tool count
3. Published Framer demo in ChatGPT's in-app browser with Site tools open
4. Visible form values prepared by a WebMCP tool without submission
5. Shopify product/plan discovery and prepared-cart handoff

## Submission Readiness Notes

- Public demo: ready and reachable
- Public repository: ready; GitHub detects the MIT license
- Latest GitHub Actions CI: passing
- Automated live WebMCP validation: passing with all 30 tools
- ChatGPT Site tools call: TODO — capture one successful real invocation
- Public YouTube demo: TODO
- Devpost form: TODO — paste the final copy and submit before September 4, 2026 at 1:00 AM PT / 5:00 PM JST

## Known Limitations

- CMS content is snapshotted at publish time and should be rescanned after CMS changes.
- Cross-origin iframes, hosted card fields, and closed Shadow DOM are intentionally opaque.
- File bytes never enter WebMCP arguments; the person chooses local files.
- Card, bank, password, OTP, wallet, CAPTCHA, biometric, signature, and final payment actions remain human-only.
- ChatGPT's in-app browser currently supports imperative top-level tools but not declarative form tools or tools registered inside iframes.
- Cloudflare Pay Per Crawl billing requires an enrolled zone; the repository supplies the structured-content and policy implementation but does not claim that a non-enrolled zone charges crawlers.

## TODO Official Form Fields

- Public YouTube demo URL
- Final thumbnail and gallery images selected in Devpost
- Team members, if any
- Any optional testing notes requested by the live Devpost form
- Final confirmation that the ChatGPT Site tools demo was recorded successfully
