# WebMCP Challenge submission checklist

Checked against the official OpenAI challenge page, Devpost overview, rules, resources, and the September 4 deadline-extension notice on September 4, 2026.

## Deadline and eligibility

- The deadline was extended by 12 hours because of an OpenAI outage. Submit before September 4, 2026 at 1:00 AM Pacific Time (September 4 at 5:00 PM JST).
- Entrants must be at least the age of majority where they live and reside in an eligible OpenAI API-supported territory.
- The official rules control if any other challenge copy conflicts with them.

## Required submission materials

- Working hosted URL accessible in ChatGPT's in-app browser or Chrome with WebMCP enabled.
- Public source repository with an open-source license.
- Project description explaining why WebMCP fits, how UX improves, what humans and agents can now do together, and how WebMCP was implemented.
- Public YouTube demo under three minutes, with audio, clearly showing the working project and its WebMCP use.
- Clear testing instructions. Judges are not required to build the project locally.

## Judging criteria to demonstrate

- WebMCP Leverage: real, non-trivial, thoughtful WebMCP implementation.
- Execution: complete and coherent working product, not only a technical proof.
- Potential Impact: credible real audience and problem-solution fit.
- Creativity & Ambition: a distinctive concept and meaningful scope.

## AgentReady evidence

- Framer-native plugin and live responsive Framer site.
- Direct, Hybrid, and Cloudflare Bridge delivery with duplicate-safe imperative registration.
- Chrome 149+ Origin Trial token installation, feature detection, declarative-form de-duplication, active-state UI, and secure metadata/output budgets.
- 30-tool browser-runtime test matrix plus a same-origin MCP gateway covering forms, conversation, commerce, payments, paid crawling, cited knowledge, and provenance.
- Visible human/agent handoffs for files, external messaging, checkout, and payment.
- Shopify Storefront cart workflow plus Shopify-hosted checkout handoff.
- Cloudflare WebMCP bridge/pack integration, same-origin MCP gateway, Durable Objects, R2, Turnstile, MPP Agentic Payments, Pay Per Crawl, AI Search, Browser Run, Analytics Engine, Workers Observability, and optional AI Gateway reference Workers.
- MIT license and public repository.

## Chrome judge path

1. Open the final published origin in Chrome 149+ with its valid WebMCP Origin Trial token, or enable the local testing flag for development.
2. Confirm the Origin Trial and WebMCP surface in Chrome DevTools, then inspect `window.__agentReadyRegistration` for zero failures.
3. Run a read-only discovery tool and a visible form-preparation tool; demonstrate that a declarative `toolname` form is not duplicated.
4. Show an oversized-content query returning bounded retry guidance, cancellation of a waiting call, and refusal of payment/sensitive submission.

## ChatGPT judge path

1. Use the latest ChatGPT desktop app with GPT-5.6 Sol or GPT-5.6 Terra.
2. Enable **Settings → Browser → Permissions → Enable site tools**.
3. Open `https://agentready.framer.website/?judge=20260904` in the in-app browser.
4. Open **Site tools → Available site tools** and confirm the page exposes 30 imperative tools.
5. Invoke `search_site`, `inspect_forms`, and `prefill_form`; verify that the visible page changes and no form is submitted.
6. Invoke the Shopify search/cart flow and stop before checkout or payment confirmation.
7. Capture the tool inventory and successful calls in the public demo video.

## Freeze rule

After submissions close, do not edit the Devpost entry, submitted repository, or live site until winners are announced. Continue development only in a separate fork so the submitted version stays unchanged.
