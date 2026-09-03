# AgentReady for Framer

Turn a Framer site into an agent-native website without writing WebMCP code.

AgentReady scans a Framer project, suggests useful agent capabilities, and installs an imperative WebMCP runtime into the published site through Framer Custom Code.

**Live demo:** [make-aspects-824660.framer.app/agent-ready](https://make-aspects-824660.framer.app/agent-ready)

## Why AgentReady

Browser agents normally have to infer intent from pixels and DOM structure. WebMCP lets a website expose explicit, typed tools through `document.modelContext.registerTool()`. AgentReady makes that workflow accessible to Framer designers.

The complete configured runtime can publish 25 focused tools:

- `search_site` — search visible headings, text, and links
- `search_collection` — search serialized Framer CMS content
- `get_collection_item` — retrieve a CMS item by slug
- `navigate_to` — navigate within the origin or reveal a section
- advanced forms — inspect and prepare text, address, options, dates, multi-step flows, and secure file-picker handoff
- conversation — read chatbot replies, compose a turn, and optionally send/wait
- safe checkout — prepare non-sensitive order details while keeping credentials and final confirmation human-only
- Shopify Storefront — search products, manage cart state, and hand off to Shopify Checkout
- Cloudflare Agentic Payments — discover paid offers and expose MPP HTTP 402 challenges and receipts
- Cloudflare Pay Per Crawl — publish price, permitted purposes, evidence guidance, and a paid structured JSON representation of Framer content
- `submit_form` — optional side-effecting submission for non-payment, non-authentication forms

## Product flow

```text
Scan project → Review capabilities → Publish tools → Test with an agent
```

The plugin reads the current canvas and CMS collections, generates a compact runtime configuration, and installs a top-level `<script>` using `framer.setCustomCode()`. No separate MCP server is required for the core runtime; Shopify and Cloudflare are optional integrations.

The WebMCP runtime follows Chrome's imperative API guidance: capability-scoped tools, strict runtime validation, read-only and untrusted-content annotations, abortable registration, visible UI state changes, and human review for sensitive actions. Standard declarative form annotations remain useful for simple native forms, while AgentReady uses imperative tools for Framer's custom controls, multi-step state, chat, commerce, and security boundaries.

## Plugin distribution

The public Framer Marketplace package is produced with `npm run pack`. Enterprise teams can alternatively self-host the static `dist` output as a Workspace Plugin on Vercel or Cloudflare Pages; `framer.json` must remain at the deployment root. This plugin UI hosting is separate from the optional Cloudflare Workers used for payments, uploads, and paid crawl delivery.

See [the capability matrix](docs/capability-matrix.md) for the full 25-tool inventory and safety boundaries, and [the WebMCP design notes](docs/webmcp-design.md) for the Chrome API decisions.

## Development

Requirements:

- Node.js 20 or newer
- A Framer account with Plugin Developer Tools enabled

```bash
npm install
npm run dev
```

Then open Framer, enable Plugin Developer Tools, and choose **Open Development Plugin**.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run pack
```

`npm test` executes the generated runtime in a simulated browser and validates all tool behaviors. To verify the deployed Framer page end to end:

```bash
AGENTREADY_DEMO_URL=https://make-aspects-824660.framer.app/agent-ready npm run test:live
```

The live test fetches the actual Framer HTML and executes installed Custom Code with a WebMCP-compatible model context. The isolated suite covers all 25 optional tools.

## Testing WebMCP

1. Open the plugin in a Framer website project.
2. Review the scan results and enabled capabilities.
3. Select **Install tools**.
4. Publish the Framer site.
5. Open the live URL in ChatGPT's built-in browser, or in Chrome with WebMCP testing enabled.
6. Inspect the site's available tools and ask the agent to search content, navigate, or prepare a form.

The ChatGPT built-in browser currently discovers imperative tools registered by top-level page JavaScript. AgentReady intentionally does not rely on declarative form tools or iframe registration.

## Safety choices

- Form filling and form submission are separate capabilities.
- Form submission is disabled by default.
- Navigation is restricted to the current origin.
- CMS drafts are excluded from tool results.
- Generated inputs use narrow JSON Schemas and reject extra properties.
- Payment and authentication secrets are never read, returned, or filled.
- Shopify cart IDs stay in browser session storage and are summarized without their secret key.
- Cloudflare payment private keys stay in the paying Agent/Worker, never in Framer Custom Code.

## Current limitations

- CMS content is snapshotted when tools are published; re-run the plugin after CMS updates.
- Form detection is heuristic and runtime form fields must expose a `name`, `id`, or `aria-label`.
- Site scanning currently covers the active canvas plus project CMS collections.
- WebMCP remains experimental and browser support varies.
- A WebMCP host must be MPP/x402-aware to fulfill an agentic payment automatically; other hosts can still inspect the challenge and use a human payment handoff.

## Demo status

The Challenge demo is built in Framer through its Server API, includes desktop/tablet/mobile breakpoints, and has the AgentReady runtime installed in Framer Custom Code. The public preview and its registered tool behavior are covered by `npm run test:live`.

See [docs/submission.md](docs/submission.md) for the submission copy, demo prompts, and video outline.

The optional [Cloudflare Worker](cloudflare/README.md) adds Durable Object session state, Turnstile verification, R2 upload handoff, and an MPP-protected offer endpoint.

## License

[MIT](LICENSE)
