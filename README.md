# AgentReady for Framer

[![CI](https://github.com/masterleopold/agentready-framer/actions/workflows/ci.yml/badge.svg)](https://github.com/masterleopold/agentready-framer/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-agentready.framer.website-ffffff?logo=framer&logoColor=black)](https://agentready.framer.website)
[![License: MIT](https://img.shields.io/badge/license-MIT-111111.svg)](LICENSE)

**The no-code WebMCP builder for Framer.** AgentReady scans a Framer project, lets its owner choose what agents may do, and publishes typed tools through Framer Custom Code, Cloudflare's edge-injected WebMCP bridge, or both.

**Live demo:** [agentready.framer.website](https://agentready.framer.website)

![AgentReady running as a development plugin inside Framer](docs/framer-plugin-live.jpg)

## What it does

Browser agents normally infer intent from pixels and DOM structure. WebMCP lets a site expose explicit tools through `document.modelContext.registerTool()`. AgentReady turns Framer pages, CMS collections, forms, conversations, commerce, and paid content into a capability-scoped tool surface without requiring the site owner to write WebMCP code.

| Surface | AgentReady capability | Human and security boundary |
| --- | --- | --- |
| Pages and CMS | Search visible content, query CMS snapshots, retrieve items, and navigate within the site | Same-origin navigation only; draft CMS records are excluded |
| Forms | Inspect and prepare text, numbers, addresses, checkboxes, radios, selects, multi-selects, dates, times, accessible calendars, and multi-step flows | Submission is separately enabled and sensitive forms are refused |
| Files | Detect constraints and open the secure file picker; optional Turnstile + R2 handoff | The person selects the local file; bytes never enter model arguments |
| Conversations | Read visible turns, compose a message, and optionally send and wait for the reply | Sending is a separately enabled external action |
| Generic checkout | Prepare plans, quantities, contact details, addresses, shipping, and coupons | Card/bank data, passwords, OTPs, wallet authentication, and final confirmation remain human-only |
| Shopify | Storefront MCP + UCP catalog, product and policy lookup, cart changes, and Shopify Checkout handoff | Cart secrets stay in browser storage; Shopify owns payment authentication and confirmation |
| Cloudflare Agentic Payments | Inspect offers and return MPP/x402 `402` challenges, retry guidance, receipts, and verified order identifiers | Scoped payment credentials remain with the paying agent, never Framer or WebMCP arguments |
| Cloudflare Pay Per Crawl | Advertise pricing and permitted purposes and serve licensed structured JSON with a content digest | Cloudflare performs crawler identity, enforcement, settlement, and charge evidence |
| Knowledge and trust | Cloudflare AI Search, cited answers, same-origin SHA-256 attestations, anonymous metrics, and Browser Run verification | Retrieved content is untrusted; administration and secrets stay server-side |

The complete Direct runtime contains **30 optional tools**. A site only publishes the capabilities its owner enables, so counts vary by configuration. As of **September 4, 2026**, the public Framer demo exposes **17 browser-local tools** and is checked end to end by `npm run test:live`.

The exact inventory and boundaries are documented in [docs/capability-matrix.md](docs/capability-matrix.md).

## Delivery architecture

```text
Framer plugin
   ├─ scans the canvas and CMS
   ├─ generates a narrow runtime configuration
   └─ publishes Custom Code
            │
            ├─ Direct: browser-local WebMCP tools
            └─ Hybrid: browser-local actions + same-origin /mcp
                                                   │
                                                   └─ Cloudflare Workers
                                                      knowledge · Shopify reads
                                                      payments · paid JSON · trust
```

| Mode | Registered tools | Best fit |
| --- | ---: | --- |
| **Direct** | Up to 30 | Framer-hosted sites and the fastest zero-infrastructure setup |
| **Hybrid** (recommended) | Up to 31 AgentReady tools | A Cloudflare-proxied custom domain; UI state stays local and credentialed integrations stay at the edge |
| **Cloudflare Bridge** | Up to 11 gateway tools | Server-backed discovery and read operations without local DOM tools |

Hybrid moves ten network-backed tools to the same-origin `/mcp` gateway, preserves the remaining browser-state tools locally, and adds `agentready_edge_status`. It de-duplicates names automatically. Cloudflare's optional external Content Credentials pack adds two more image-metadata tools; those tools are managed by Cloudflare and are not included in the AgentReady counts above.

The runtime follows Chrome's imperative WebMCP guidance: narrow JSON Schemas, strict validation, abortable registration, capability annotations, visible UI state changes, untrusted-content labeling, and human review for sensitive or irreversible actions. Native declarative annotations remain useful for simple forms; AgentReady uses imperative tools for Framer custom controls, multi-step state, chat, commerce, and explicit safety boundaries.

## Try the live demo

Open [agentready.framer.website](https://agentready.framer.website) in a WebMCP-capable agent browser and try prompts such as:

- “Find the available form tools and prepare the application with my address, preferences, and appointment time.”
- “Read the latest chatbot reply, compose a follow-up question, and wait for me before sending it.”
- “Inspect the checkout and prepare every non-sensitive field. Leave payment and final confirmation to me.”
- “Find the AgentReady plugin offer and explain the available purchase or payment handoff.”

The demo contains real multi-step forms, option groups, date/time inputs, file-picker handoff, a conversational UI, safe checkout, Shopify and Cloudflare examples, and the AgentReady runtime installed through Framer Custom Code.

## Run the Framer plugin

Requirements:

- Node.js 20 or newer
- A Framer account with Plugin Developer Tools enabled

```bash
git clone https://github.com/masterleopold/agentready-framer.git
cd agentready-framer
npm install
npm run dev
```

In Framer, enable Plugin Developer Tools and choose **Open Development Plugin**. The product flow is:

```text
Scan project → Review capabilities → Choose delivery → Install tools → Publish → Test
```

Build the Framer Marketplace archive with `npm run pack`. Workspace teams may instead host the static `dist` directory on Vercel or Cloudflare Pages, with `framer.json` at the deployment root. Plugin UI hosting is separate from the optional Workers that provide edge integrations.

## Add the Cloudflare Hybrid gateway

The repository includes five deployment-ready Worker configurations: coordination/uploads, Agentic Payments, Pay Per Crawl JSON delivery, intelligence, and the WebMCP gateway. They require your own Cloudflare account resources, routes, and secrets; the repository does not deploy them automatically.

```bash
npm install --prefix cloudflare
npm run typecheck --prefix cloudflare
npm run deploy:mcp --prefix cloudflare
```

Then:

1. Replace the example origins and bindings in `cloudflare/wrangler.mcp.jsonc` and the configurations for any optional Workers you use.
2. Route the gateway to the Framer custom domain at `/mcp*`. Do not configure a cross-origin `*.workers.dev` URL as the plugin's MCP path.
3. In Cloudflare Dashboard, open **Agent Readiness → WebMCP**, enable the Site MCP Server pack, and set its URL to `/mcp`.
4. In AgentReady, select **Hybrid**, use the same `/mcp` path, install the tools, and publish the site.
5. Confirm that the published HTML contains `/.webmcp/bridge.js`, then test MCP `initialize`, `tools/list`, and a safe tool call.

Optionally enable Cloudflare's Content Credentials pack. The current Developer Preview decodes embedded C2PA metadata but reports `signatureVerified: false`; it must not be presented as cryptographic signature verification.

Detailed provisioning, secrets, routes, and production caveats are in [cloudflare/README.md](cloudflare/README.md).

## Shopify connection

**Auto** mode discovers Shopify's standard Storefront MCP tools at `/api/mcp` and UCP catalog tools at `/api/ucp/mcp`, caches their advertised schemas for five minutes, and adapts cart arguments to the store's discovered `update_cart` schema. UCP requests include the configured HTTPS agent profile.

If a store restricts MCP, catalog and cart operations fall back to Storefront GraphQL. Merchant policy answers and complete UCP behavior explicitly report themselves unavailable rather than inventing results. Replace Shopify's development-example agent profile URL with an AgentReady-owned HTTPS profile before production.

References: [Shopify Storefront MCP](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront), [UCP catalog MCP binding](https://ucp.dev/latest/specification/shopping/catalog/mcp/), and [Shopify API terms](https://www.shopify.com/legal/api-terms).

## Safety model

- Form preparation and submission are separate capabilities; submission is disabled by default.
- `submit_form` refuses checkout, authentication, and sensitive forms even when enabled.
- Payment credentials, card data, bank details, passwords, PINs, OTPs, passkeys, recovery codes, wallet keys, and stored secret values are blocked.
- Shopify cart identifiers remain in browser session storage and are summarized without their secret key.
- Cloudflare payment keys stay in the paying Agent or Worker, never Framer Custom Code.
- The MCP gateway rejects cross-site browser requests, JSON-RPC batches, non-JSON or oversized bodies, unknown tools, invalid Shopify domains, and unapproved origins.
- Analytics never records prompts, chat text, form values, tool arguments, payment data, or response bodies.
- Final purchase, hosted checkout confirmation, wallet authentication, CAPTCHA, biometrics, signatures, and local file selection stay with the person.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | Framer plugin UI, scanner, configuration, runtime generator, and styles |
| `framer/` | Code components used by the interactive demo page |
| `cloudflare/` | Five optional Worker configurations and edge implementation |
| `scripts/` | Isolated runtime, gateway, live-site, and demo validation |
| `docs/` | Capability matrix, WebMCP design, coverage audit, challenge checklist, and submission material |

## Validate the repository

```bash
npm run typecheck
npm run lint
npm test
npm run check:demo
npm run build
npm run pack
npm run typecheck --prefix cloudflare
```

`npm test` executes all 30 Direct runtime tools in a simulated browser and validates the same-origin Cloudflare MCP gateway. Verify the deployed Framer page separately with:

```bash
AGENTREADY_DEMO_URL=https://agentready.framer.website npm run test:live
```

CI runs type checking, linting, the runtime and gateway tests, the demo component check, production build, plugin packaging, Cloudflare type checking, and dry-run builds for all five Workers.

## Current limitations

- CMS content is snapshotted at publish time; re-run the plugin after CMS changes.
- Form discovery is heuristic, and runtime fields need a `name`, `id`, or `aria-label`.
- The scanner currently covers the active canvas and project CMS collections.
- Cross-origin iframes, hosted card fields, and closed Shadow DOM are intentionally opaque.
- WebMCP remains experimental and host support varies.
- Automatic MPP/x402 fulfillment requires a compatible payment-aware host. Other hosts can inspect the challenge and continue through a human handoff.
- A production AgentReady purchase requires a configured Shopify product or HTTPS checkout URL. No merchant credentials or simulated completed payments ship in this repository.
- Pay Per Crawl requires an enrolled Cloudflare zone. The Worker adds structured JSON; Cloudflare performs billing enforcement.

## Documentation

- [Capability and safety matrix](docs/capability-matrix.md)
- [WebMCP design notes](docs/webmcp-design.md)
- [Request coverage and launch status](docs/request-coverage.md)
- [Challenge checklist](docs/challenge-checklist.md)
- [Submission copy, demo prompts, and video outline](docs/submission.md)
- [Cloudflare deployment guide](cloudflare/README.md)

## License

[MIT](LICENSE)
