# AgentReady three-minute demo runbook

Target length: **2:50–2:57**. Record at 1920 × 1080, 30 fps, with English narration or accurate English captions. Keep the public URL, the 30-tool count, visible page changes, and the human-only payment boundary readable.

## Recording setup

1. Use a duplicate of the AgentReady Framer project for the install-and-publish scene. Do not install another runtime into the production project while its legacy **API Plugin** Custom Code is active.
2. In the duplicate, remove any legacy AgentReady/API Plugin Custom Code, open the Marketplace AgentReady plugin, load the demo settings if offered, and enable all 30 tools.
3. Keep Storefront tokens, Worker secrets, wallet credentials, and admin secrets off screen. Public Shopify and Cloudflare endpoint URLs may be shown.
4. In ChatGPT, select GPT-5.6 Sol or Terra and enable **Settings → Browser → Permissions → Enable site tools**.
5. Open `https://agentready.framer.website/?judge=20260904-video` in ChatGPT's in-app browser. Confirm **Available site tools** shows 30 tools before recording.
6. Run every prompt once before recording. Start the final take with an empty Shopify cart, the application form reset, and a fresh cache-busting query parameter.
7. Cut network waits and typing pauses, but do not fake results or reorder a result before its tool call. Prefer one continuous screen recording with clean jump cuts.

## Timeline and narration

| Time | Picture and action | Suggested English narration |
| --- | --- | --- |
| 0:00–0:10 | Open the live AgentReady page. Frame the hero and the visible **30 tools** badge. | “Websites are designed for people, but agents still have to guess what a page can do. AgentReady turns any Framer site into an explicit, safe action surface.” |
| 0:10–0:32 | Switch to Framer. Open AgentReady and show the automatic site scan: text, links, CMS collections, and form candidates. Scroll just enough to reveal the capability switches. | “The Framer plugin scans the project creators already built. No schema authoring is required. The owner chooses exactly which capabilities agents may discover and use.” |
| 0:32–0:49 | Show Advanced forms, Read and compose chat, Shopify commerce, Cloudflare payments, Pay Per Crawl, and Cloudflare intelligence enabled. Briefly show the configured public endpoints. | “Thirty typed tools cover CMS, multi-step forms, conversations, Shopify Storefront MCP, Cloudflare Agentic Payments, paid JSON crawling, cited search, and provenance.” |
| 0:49–1:04 | Click **Install 30 tools**. Show the installed state and readiness checks, then click **Publish site** in the duplicate project. Cut directly to the successful state. | “AgentReady generates an imperative WebMCP runtime in Framer Custom Code and ships it through the normal Framer publishing workflow.” |
| 1:04–1:16 | Switch to ChatGPT's in-app browser on the public demo. Open **Site tools → Available site tools** and show the 30-tool inventory. | “Now ChatGPT discovers the site's real tools directly from the page.” |
| 1:16–1:43 | Run the form prompt below. Show the agent calling form tools, the page moving to the relevant step, and the filled address, choices, and appointment. End with the submit button untouched. | “The agent inspects the live form, fills only safe fields, selects accessible options, and sets the date and time. It preserves the multi-step state and stops before submission.” |
| 1:43–2:01 | Run the conversation prompt. Show the previous chatbot answer being read, a follow-up being sent, and the new reply returned. | “Conversational interfaces are tools too. The agent reads the visible history, sends a scoped follow-up, and waits for the next reply.” |
| 2:01–2:29 | Run the Shopify prompt. Show catalog results, the Studio variant, the updated cart, and prepared checkout. Do not open or complete checkout. | “Through Shopify Storefront MCP and UCP, the agent finds the product, compares variants, and creates a real cart. Shopify keeps payment authentication and final purchase confirmation human-only.” |
| 2:29–2:44 | Run the Cloudflare payment prompt. Show the HTTP 402/MPP challenge and the message that a payment-capable agent may continue. Do not provide a credential or pay. | “Cloudflare adds agent-native payment negotiation. The page exposes a scoped HTTP 402 challenge without ever receiving wallet keys.” |
| 2:44–2:57 | Return to the demo overview or show the Framer plugin and ChatGPT side by side. Finish on the AgentReady name and URL. | “AgentReady makes every Framer creator an agent API designer: visual setup for site owners, reliable tools for agents, and explicit control for people.” |

## Exact ChatGPT prompts

### Form

> Use this site's WebMCP tools to inspect the application form. Fill it with Demo Agent, agent@example.com, 1-1 Marunouchi, Tokyo 100-0005, Japan. Choose the Studio plan, select Design and AI, and set September 10, 2026 at 14:30. Move through the steps as needed, but do not submit.

Expected visible proof: calls including `inspect_forms`, `prefill_form`, `fill_address`, `select_form_options`, `set_form_date`, and `advance_form_step`; populated controls; no submission.

### Conversation

> Read the support chatbot's visible conversation, then send “Which payment and authentication actions remain human-only?” Wait for and summarize its new reply.

Expected visible proof: `read_conversation`, `send_chat_message`, and a newly rendered chatbot reply.

### Shopify

> Search this site's Shopify catalog for AgentReady, compare the Creator, Studio, and Agency variants, add one Studio license to the cart, and prepare checkout. Do not open checkout and do not attempt payment.

Expected visible proof: Shopify catalog and product tools, `update_shopify_cart`, `prepare_shopify_checkout`, a one-item cart, and a human-action requirement.

### Cloudflare payment

> Inspect the site's agentic payment offers and request the Studio testnet payment challenge. Do not fulfill it or provide any payment credential.

Expected visible proof: `inspect_agentic_offers`, `request_agentic_payment`, HTTP 402 with MPP or x402 metadata, and explicit user approval/payment-client requirements.

## Editing checklist

- Keep the finished video below 3:00; aim for 2:55 to leave platform-transcoding margin.
- Add concise English captions and highlight tool names only when they are actually called.
- Blur personal email, account controls, private URLs, and browser tabs unrelated to AgentReady.
- Use zoom cuts on the plugin's tool count, ChatGPT's available-tools list, the filled controls, Shopify cart, and HTTP 402 result.
- Avoid long source-code shots. If code appears, limit it to one second of the public repository and the passing 30-tool test summary.
- End on `agentready.framer.website` and include the GitHub repository in the YouTube description.
- Upload as **Unlisted** or **Public**, never Private, and verify playback while signed out before adding the URL to Devpost.

