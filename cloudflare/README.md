# AgentReady Edge (optional)

The Cloudflare Worker adds a secure, optional coordination layer to a Framer storefront or form experience:

- Durable Objects keep a bounded, non-sensitive audit trail for multi-step forms, carts, and chat turns.
- Turnstile creates a five-minute human-verification gate before a browser-selected file can be uploaded.
- R2 stores the uploaded binary without passing file contents through a model or WebMCP arguments.
- Strict origin allowlisting prevents unrelated sites from using the endpoint.

Payment credentials, passwords, OTPs, private Shopify tokens, and full form values must never be recorded as event summaries.

## Deploy

1. Replace `ALLOWED_ORIGINS` and `bucket_name` in `wrangler.jsonc`.
2. Create the R2 bucket: `npx wrangler r2 bucket create agentready-uploads`.
3. Add the Turnstile secret: `npx wrangler secret put TURNSTILE_SECRET`.
4. Run `npm install && npm run typecheck && npm run deploy`.

Set the resulting HTTPS Worker URL in the AgentReady Framer plugin. The Turnstile site key remains on the Framer page; its secret exists only in the Worker.

## Agentic Payments Worker

`src/payments.ts` is a second Worker that exposes a free offer catalog and an MPP-protected purchase route. An unauthenticated request receives HTTP `402` plus an MPP challenge; a Cloudflare Agent with a scoped payment key can fulfill it, retry, and receive a protocol receipt.

1. Set `MPP_RECIPIENT`, `MPP_CURRENCY`, the three tier amounts, and `ALLOWED_ORIGIN` in `wrangler.payments.jsonc`.
2. Add the MPP signing secret: `npx wrangler secret put MPP_SECRET_KEY --config wrangler.payments.jsonc`.
3. Deploy with `npm run deploy:payments`.

Production buyer agents should use scoped keys with spending and recipient restrictions. The Framer page never receives a wallet private key. This paid route is for agent-native digital offers; Shopify physical-goods checkout remains a separate flow ending in Shopify-hosted confirmation.

## Pay Per Crawl

`src/crawl-pricing.ts` adds path-based dynamic `crawler-price` metadata for a Framer custom domain proxied through Cloudflare. It also publishes `/.well-known/agentready.json` for discovery, `/agentready/schema.json` for the JSON Schema, and `/agentready/content.json?path=/some-page` for a same-origin-only JSON representation containing source URL, canonical URL, retrieval time, headings, readable content, JSON-LD, links, license terms, provenance, and a SHA-256 `Content-Digest`. Configure `FRAMER_ORIGIN`, the content-license variables, and paid paths; deploy it as a route for the custom domain with `npm run deploy:crawl`; then enable Pay Per Crawl in AI Crawl Control.

Pay Per Crawl does not inherently convert a page to JSON. AgentReady deliberately adds this structured delivery layer so a crawler can pay for stable machine-readable content. The Worker only sends `crawler-price` when Cloudflare requests in-band pricing through `cf-pay-per-crawl`; Cloudflare remains responsible for the signed crawler identity, `402` challenge, settlement, and `crawler-charged` evidence.

Pay Per Crawl is currently a closed beta and Cloudflare account configuration remains mandatory. The Worker does not itself charge crawlers; Cloudflare identifies signed crawlers, emits `402 Payment Required`, bills successful access, and returns `crawler-charged`. Treat retained request signatures, price/charged headers, timestamps, and content hashes as governance evidence—not as a universal legal license or protection from litigation.
