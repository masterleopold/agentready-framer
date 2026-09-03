# Framer Marketplace listing

Prepared against Framer's official [Publishing your Plugin](https://www.framer.com/developers/publishing) workflow.

## Official publication procedure

1. Confirm the plugin name and manifest icon.
2. Test the core flows across different project states and browsers.
3. Check the complete UI in Framer light and dark themes.
4. Run `npm run pack` at the repository root.
5. Open the [Framer Marketplace plugin dashboard](https://www.framer.com/marketplace/dashboard/plugins/) and choose **New Plugin**.
6. Upload the generated `plugin.zip`, add the listing copy and media below, and submit.

Uploading and submitting creates the public Marketplace entry. Keep that final action for the project owner's explicit review.

## Listing

- **Name:** AgentReady
- **Byline:** Turn any Framer site into a secure WebMCP tool surface—without writing code.
- **Categories:** Developer Tools, Integrations, AI
- **Tags:** WebMCP, AI agents, forms, Shopify, Cloudflare, accessibility
- **Website:** https://agentready.framer.website
- **Source:** https://github.com/masterleopold/agentready-framer

## Short description

AgentReady scans your Framer project, lets you choose exactly what AI agents may do, and publishes typed WebMCP tools with the same Framer workflow you already use.

## Full description

Make your Framer site understandable and actionable for AI agents without maintaining hand-written tool definitions.

AgentReady discovers pages, links, CMS collections, forms, multi-step controls, conversations, and commerce surfaces. Choose only the capabilities you want to expose, install the generated runtime, and publish from Framer.

The plugin supports safe form preparation, accessible options and calendars, file-picker handoff, chatbot turns, Shopify Storefront MCP and UCP, Cloudflare Agentic Payments, Pay Per Crawl JSON delivery, cited knowledge search, and same-origin MCP delivery.

Sensitive credentials stay human-controlled. AgentReady refuses card, bank, password, OTP, CAPTCHA, passkey, biometric, wallet-authentication, and final-payment actions. Submitting forms and sending chat messages are separate opt-in capabilities.

The project is open source under the MIT License. Cloudflare and Shopify integrations require the site owner's own accounts and configuration.

## Marketplace media checklist

1. Hero image: plugin beside the live AgentReady Framer canvas.
2. Capability image: Advanced forms, Read & compose chat, Shopify commerce, and Cloudflare integrations.
3. Safety image: human-only payment and authentication boundary.
4. Demo image: `agentready.framer.website` with the registered WebMCP tools.
5. Verify the UI in both Framer light and dark themes before publishing.

## Release notes — 0.1.0

- Publishes capability-scoped WebMCP tools from Framer.
- Covers pages, CMS, advanced forms, conversations, checkout preparation, Shopify, and Cloudflare.
- Adds Chrome WebMCP origin-trial onboarding and secure-tool limits.
- Provides Direct, Hybrid, and Cloudflare Bridge delivery modes.
