# Framer Marketplace listing

Prepared against Framer's August 7, 2026 [How to publish a plugin](https://www.framer.com/help/articles/how-to-publish-a-plugin/) workflow.
Quality preflight follows Framer's August 7, 2026 [Plugin best practices](https://www.framer.com/help/articles/plugin-best-practices/).

## Official publication procedure

1. Confirm the plugin name and manifest icon.
2. Test the core flows across different project states and browsers.
3. Check the complete UI in Framer light and dark themes.
4. Run `npm run pack` at the repository root.
5. Open the Marketplace section in Framer Community.
6. Click **Post** in the top toolbar, then choose **Plugin**.
7. Upload the generated `plugin.zip`; add the byline, description, images, tags, and pricing details below.
8. Optionally create a Community feed post, then click **Submit**.

AgentReady was published on September 4, 2026 and is available at [framer.com/marketplace/plugins/agentready](https://www.framer.com/marketplace/plugins/agentready/). Framer currently publishes a plugin immediately after submission, with no review or waiting period. Test each new version in a fresh Framer project and verify the listing copy, pricing, screenshots, and light/dark UI before submitting it.

For later releases, open the plugin's Community page, use the three-dot menu, choose **Publish New Version**, upload a newly packed ZIP, and add concise release notes.

## Listing

- **Name:** AgentReady
- **Byline:** Turn any Framer site into a secure WebMCP tool surface—without writing code.
- **Categories:** Developer Tools, Integrations, AI
- **Tags:** WebMCP, AI agents, forms, Shopify, Cloudflare, accessibility
- **Marketplace price:** Free
- **Website:** https://agentready.framer.website
- **Source:** https://github.com/masterleopold/agentready-framer
- **Support:** https://github.com/masterleopold/agentready-framer/issues

The core Direct runtime is free and open source under MIT. The Creator ($49), Studio ($149), and Agency ($399) offers on the demo site demonstrate WebMCP commerce and optional commercial licensing; they are not required to inspect, build, or run the repository. Display all paid amounts in USD in the Marketplace listing.

## Short description

AgentReady scans your Framer project, lets you choose exactly what AI agents may do, and publishes typed WebMCP tools with the same Framer workflow you already use.

## Full description

Make your Framer site understandable and actionable for AI agents without maintaining hand-written tool definitions.

AgentReady discovers pages, links, CMS collections, forms, multi-step controls, conversations, and commerce surfaces. Choose only the capabilities you want to expose, install the generated runtime, and publish from Framer.

The plugin supports safe form preparation, accessible options and calendars, file-picker handoff, chatbot turns, Shopify Storefront MCP and UCP, Cloudflare Agentic Payments, Pay Per Crawl JSON delivery, cited knowledge search, and same-origin MCP delivery.

Sensitive credentials stay human-controlled. AgentReady refuses card, bank, password, OTP, CAPTCHA, passkey, biometric, wallet-authentication, and final-payment actions. Submitting forms and sending chat messages are separate opt-in capabilities.

The project is open source under the MIT License. Cloudflare and Shopify integrations require the site owner's own accounts and configuration.

Core Direct mode requires only Framer. Shopify commerce, Cloudflare edge delivery, Agentic Payments, Pay Per Crawl, AI Search, Browser Run, and Analytics Engine are optional integrations and may require separate accounts, configuration, product availability, or usage charges. AgentReady does not require authentication for core operation. Anonymous telemetry is optional, records no prompts or form values, and can be disabled in the plugin.

For setup and troubleshooting, use the repository README and GitHub Issues. In particular, Framer isolates Custom Code by plugin identity: keep exactly one AgentReady runtime and remove a legacy **API Plugin** entry before installing from a Marketplace or development identity.

## Marketplace media checklist

1. Marketplace thumbnail: isolated current 30-tool plugin over a GPT Image 2-generated, non-organic geometric background (`docs/brand/marketplace-thumbnail.png`, 1600 × 1200). The real plugin capture is composited without regenerating its UI or text.
2. Light-theme proof: the same current plugin using Framer's light theme (`docs/brand/framer-plugin-latest-light.png`).
3. Capability image: Advanced forms, Read & compose chat, Shopify commerce, and Cloudflare integrations (`docs/brand/plugin-panel-30-tools.png`).
4. Safety image: human-only payment and authentication boundary (`docs/brand/safety-boundaries.png`).
5. Demo image: `agentready.framer.website` with the registered WebMCP tools (`docs/brand/live-demo-1600x1000.png`).
6. Keep the thumbnail focused on the real plugin UI, with minimal text and no decorative claims. If Framer marks media as reported content, replace it with the geometric-background thumbnail rather than asking visitors to reveal the blurred asset.

## Best-practice preflight

- Clear problem and accurate English listing copy: ready.
- Necessary permissions only, reversible removal, and human confirmation for consequential actions: ready.
- Loading, empty, disabled, connection-error, and publish-error states: implemented.
- Framer color tokens and automatic light/dark adaptation: visually verified in both modes on September 4, 2026.
- Fresh empty project: verified with 0 text layers, 0 links, 0 collections, and 0 form candidates; scan, 30-tool Custom Code installation, detection, and complete removal all succeeded without publishing the test project. The CMS and configured commerce paths are covered by the live AgentReady project and automated runtime validation.
- External dependencies, authentication, privacy, limitations, pricing, and support: disclosed above and in the README.
- High-quality icon and functional screenshots: ready in `public/icon.svg` and `docs/brand/`.

## Release notes — 0.1.1

- Replaces the unsupported native removal confirmation with an accessible confirmation panel rendered inside the plugin.
- Keeps removal reversible and permission-gated, prevents duplicate actions while removal is running, and reports failures without closing the panel.
- Adds lint guards that reject future uses of native `alert()`, `confirm()`, or `prompt()` dialogs.

## Release notes — 0.1.0

- Publishes capability-scoped WebMCP tools from Framer.
- Covers pages, CMS, advanced forms, conversations, checkout preparation, Shopify, and Cloudflare.
- Adds Chrome WebMCP origin-trial onboarding and secure-tool limits.
- Provides Direct, Hybrid, and Cloudflare Bridge delivery modes.
