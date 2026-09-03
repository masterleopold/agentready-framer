# Capability and safety matrix

AgentReady separates preparation, external actions, and irreversible actions. A site owner chooses each capability in the Framer plugin; the generated runtime never returns stored secret values.

| Surface | Supported behavior | Boundary |
| --- | --- | --- |
| Text | text, search, email, telephone, URL, textarea, contenteditable | Passwords, PINs, OTPs, passkeys, and recovery codes are blocked |
| Numbers | number, range, slider, spinbutton | Constraints are reported and native events are emitted |
| Choices | select, multi-select, radio, checkbox, switch, pressed button, tabs, ARIA listbox/option and combobox | Custom canvas-only widgets remain best effort |
| Date and time | date, time, datetime-local, month, week, date ranges, accessible calendar grids, timezone context | Ambiguous locale-only dates require review |
| Address | recipient, organization, address lines, city, region, postal code, country, email, phone; shipping/billing autocomplete semantics | Values are prepared and reviewed before submission |
| Multi-step forms | inspect the active step; move Next/Back; preserve visible values | A step tool refuses final submit, purchase, booking, and payment buttons |
| Files | detect input, accepted formats and multiplicity; focus the secure picker | A model cannot choose a local file. Optional Cloudflare handoff stores only the human-selected binary in R2 |
| Chat | read user/assistant turns, compose a response, optionally send and wait for new replies | Sending is a separately enabled external action |
| Generic checkout | inspect and prepare plan, quantity, contact, address, shipping and coupon fields | PAN, CVV/CVC, bank details, passwords, OTPs, wallet auth, and final payment are human-only |
| Shopify | UCP catalog search, batch lookup, interactive variant selection, localization, price/category filters, merchant policies/FAQ, cart create/read/update, and checkout URL; GraphQL fallback | Cart secret is never returned. Context hints are non-identifying. Shopify-hosted checkout owns payment authentication and confirmation |
| Cloudflare Agentic Payments | discover offers and surface MPP/x402 HTTP 402 challenges, required retry header, verified order IDs, and receipts | The paying agent owns its scoped key and fulfills the challenge outside the page. No wallet private key or payment credential is placed in Framer or WebMCP arguments |
| Cloudflare Pay Per Crawl | expose crawler price, permitted purposes, discovery metadata, a JSON Schema, structured JSON-LD content, content digest, license, provenance, and evidence guidance | Cloudflare zone setup performs enforcement and billing; AgentReady generates JSON while Pay Per Crawl itself is content-type agnostic |
| Cloudflare intelligence | AI Search hybrid retrieval and cited answers, same-origin SHA-256 attestations, anonymous per-tool metrics, and Browser Run release verification | Cloudflare account management and admin verification remain server-side; prompts, form values, payment data, and chat text are not analytics fields |
| Cloudflare WebMCP bridge | Edge-inject the WebMCP bridge and compose the same-origin Site MCP Server and Content Credentials packs | Hybrid keeps UI state local; the preview C2PA pack decodes metadata but does not cryptographically verify signatures |

## Tool inventory

The full configured runtime registers 30 tools:

- Discovery: `search_site`, `search_collection`, `get_collection_item`, `navigate_to`
- Forms: `inspect_forms`, `prefill_form`, `fill_address`, `select_form_options`, `set_form_date`, `advance_form_step`, `prepare_file_upload`, `submit_form`
- Conversation: `read_conversation`, `compose_chat_message`, `send_chat_message`
- Checkout: `inspect_checkout`, `prepare_checkout`
- Shopify: `search_shopify_catalog`, `lookup_shopify_catalog`, `get_shopify_product`, `search_shopify_policies`, `get_shopify_cart`, `update_shopify_cart`, `prepare_shopify_checkout`
- Cloudflare payments: `inspect_agentic_offers`, `request_agentic_payment`
- Crawl monetization: `discover_paid_content`
- Knowledge and trust: `search_site_knowledge`, `answer_from_site`, `get_content_provenance`

`npm test` runs all 30 tools against a browser fixture containing a multi-step application, address fields, radios, checkboxes, date/time inputs, a file input, hidden breakpoint duplicates, a conversational UI, a sensitive checkout, native Shopify MCP/UCP endpoints with discovery, an MPP challenge, paid-crawl policy, AI Search results, a cited answer, and a provenance attestation.

Hybrid adds `agentready_edge_status`, moves ten network-backed tools to the same-origin `/mcp` gateway, and keeps the remaining browser-state tools local. Cloudflare Bridge mode exposes up to 11 gateway tools without registering local tools. Enabling Cloudflare's external Content Credentials pack adds its two image-provenance tools; these are counted as expected edge tools in the plugin but are activated in the Cloudflare dashboard.

## Known limits

- Cross-origin iframes and closed Shadow DOM are intentionally opaque. This also prevents accidental access to hosted card fields.
- Proprietary drag-and-drop, canvas, and inaccessible widgets are best effort until they expose native elements or ARIA semantics.
- File pickers, CAPTCHAs, biometrics, signatures, wallet authentication, and final financial confirmation require the person.
- Cloudflare MPP/x402 makes HTTP resources and tools payable. It does not replace Shopify's retail order and checkout ledger; the two integrations are complementary.
