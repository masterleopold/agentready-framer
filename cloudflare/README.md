# AgentReady Edge (optional)

The Cloudflare Worker adds a secure, optional coordination layer to a Framer storefront or form experience:

- Durable Objects keep a bounded, non-sensitive audit trail for multi-step forms, carts, and chat turns.
- Turnstile creates a five-minute human-verification gate before a browser-selected file can be uploaded.
- R2 stores the uploaded binary without passing file contents through a model or WebMCP arguments.
- Strict origin allowlisting prevents unrelated sites from using the endpoint.

Payment credentials, passwords, OTPs, private Shopify tokens, and full form values must never be recorded as event summaries.

## Same-origin WebMCP gateway

`src/mcp-gateway.ts` implements the MCP JSON-RPC endpoint used by Cloudflare's Site MCP Server pack. It exposes only public, capability-scoped tools: edge status, AI Search/provenance, payment offer discovery and 402 challenge retrieval, paid JSON discovery, and read-only Shopify Storefront MCP/UCP catalog and policy calls. Stateful DOM, form, chat, cart, and checkout-handoff tools remain browser-local in AgentReady Hybrid mode.

1. Put the Framer custom domain behind Cloudflare and replace the example values in `wrangler.mcp.jsonc`.
2. Deploy the Worker with `npm run deploy:mcp` and route it to the same origin at `/mcp` (for example `site.example/mcp*`). Do not use a cross-origin Workers URL in the plugin.
3. In Cloudflare Dashboard open **Agent Readiness → WebMCP**, enable WebMCP, add the Site MCP Server pack, and set its MCP URL to `/mcp`.
4. Optionally enable the Content Credentials pack. Its Developer Preview tools parse C2PA metadata but do not cryptographically verify the signature (`signatureVerified: false`).
5. Choose **Hybrid** in the Framer plugin and use the identical `/mcp` path. Publish and verify that HTML contains `/.webmcp/bridge.js`.

The gateway validates same-origin/allowlisted `Origin`, `Sec-Fetch-Site`, content type, payload size, JSON-RPC shape, tool availability, same-origin provenance targets, Shopify domains, and offer IDs. It forwards no caller authorization or payment credentials. A payment-aware client fulfills the returned scoped challenge outside the page.

## Deploy

1. Replace `ALLOWED_ORIGINS` and `bucket_name` in `wrangler.jsonc`.
2. Create the R2 bucket: `npx wrangler r2 bucket create agentready-uploads`.
3. Add the Turnstile secret: `npx wrangler secret put TURNSTILE_SECRET`.
4. Run `npm install && npm run typecheck && npm run deploy`.

Set the resulting HTTPS Worker URL in the AgentReady Framer plugin. The Turnstile site key remains on the Framer page; its secret exists only in the Worker.

## Agentic Payments Worker

`src/payments.ts` is a second Worker that exposes a free offer catalog and an MPP-protected purchase route. An unauthenticated request receives HTTP `402` plus an MPP challenge; a Cloudflare Agent with a scoped payment key can fulfill it, retry, and receive a protocol receipt.

1. Set `MPP_RECIPIENT`, `MPP_CURRENCY`, `MPP_TESTNET`, the three tier amounts, and `ALLOWED_ORIGIN` in `wrangler.payments.jsonc`. Keep testnet enabled during development and explicitly set it to `false` for a reviewed production deployment.
2. Add the MPP signing secret: `npx wrangler secret put MPP_SECRET_KEY --config wrangler.payments.jsonc`.
3. Deploy with `npm run deploy:payments`.

Production buyer agents should use scoped keys with spending and recipient restrictions. The Framer page only exposes the challenge, credential-header name, and receipt; it never receives a wallet private key or payment credential. Each verified payment produces a deterministic, non-reversible order and entitlement ID derived from the verified credential, so retrying the same paid request does not mint unrelated IDs; responses are marked `no-store`. Retain the `Payment-Receipt` with the order ID as payment evidence. This paid route is for agent-native digital offers; Shopify physical-goods checkout remains a separate flow ending in Shopify-hosted confirmation.

The Worker currently accepts one-time MPP payments through Tempo. Cloudflare also supports cards through other MPP payment methods, recurring/usage-based MPP payments, and x402. Those methods require an intentional merchant configuration and are not advertised by this Worker until configured.

## Pay Per Crawl

`src/crawl-pricing.ts` adds path-based dynamic `crawler-price` metadata for a Framer custom domain proxied through Cloudflare. It also publishes `/.well-known/agentready.json` for discovery, `/agentready/schema.json` for the JSON Schema, and `/agentready/content.json?path=/some-page` for a same-origin-only JSON representation containing source URL, canonical URL, retrieval time, headings, readable content, JSON-LD, links, license terms, provenance, and a SHA-256 `Content-Digest`. Configure `FRAMER_ORIGIN`, the content-license variables, and paid paths; deploy it as a route for the custom domain with `npm run deploy:crawl`; then enable Pay Per Crawl in AI Crawl Control.

Pay Per Crawl does not inherently convert a page to JSON. AgentReady deliberately adds this structured delivery layer so a crawler can pay for stable machine-readable content. The Worker only sends `crawler-price` when Cloudflare requests in-band pricing through `cf-pay-per-crawl`; Cloudflare remains responsible for the signed crawler identity, `402` challenge, settlement, and `crawler-charged` evidence.

Pay Per Crawl is currently a closed beta and Cloudflare account configuration remains mandatory. The Worker does not itself charge crawlers; Cloudflare identifies signed crawlers, emits `402 Payment Required`, bills successful access, and returns `crawler-charged`. Treat retained request signatures, price/charged headers, timestamps, and content hashes as governance evidence—not as a universal legal license or protection from litigation.

## Intelligence Worker

`src/intelligence.ts` combines four Cloudflare services without exposing Cloudflare account administration to site visitors:

- AI Search hybrid retrieval and grounded answers with cited source chunks.
- Optional AI Gateway generation over retrieved excerpts. Retrieved content is explicitly treated as untrusted data.
- Analytics Engine events containing only origin, tool name, success/error, anonymous session hash, duration, and count. Tool arguments, prompts, form values, responses, and payment data are never telemetry fields.
- Browser Run rendering for administrator-triggered knowledge sync and release verification.

The public routes are `/v1/knowledge/search`, `/v1/knowledge/answer`, `/v1/provenance`, `/v1/telemetry`, and `/v1/status`. `/v1/admin/sync` and `/v1/verify` require the `x-agentready-admin` secret and accept only URLs whose origins appear in `ALLOWED_ORIGINS`.

1. Replace the example origins, AI Search instance, namespace, dataset, and license URL in `wrangler.intelligence.jsonc`.
2. Add the admin secret: `npx wrangler secret put AGENTREADY_ADMIN_TOKEN --config wrangler.intelligence.jsonc`.
3. Optionally set `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN`, and `AI_GATEWAY_MODEL`; the gateway URL must be an OpenAI-compatible chat-completions endpoint.
4. Deploy with `npm run deploy:intelligence`.
5. Synchronize rendered Framer pages by posting `{ "urls": ["https://your-site.example/"] }` to `/v1/admin/sync` with `x-agentready-admin`.
6. Enter the Worker URL under **Cloudflare intelligence** in the Framer plugin and enable anonymous analytics if desired.

Browser Run bindings require remote development, so use `npm run dev:intelligence`. AI Search and Browser Run account resources are external prerequisites; the dry-run build validates their bindings without provisioning or billing them.
