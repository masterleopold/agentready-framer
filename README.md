# AgentReady for Framer

Turn a Framer site into an agent-native website without writing WebMCP code.

AgentReady scans a Framer project, suggests useful agent capabilities, and installs an imperative WebMCP runtime into the published site through Framer Custom Code.

## Why AgentReady

Browser agents normally have to infer intent from pixels and DOM structure. WebMCP lets a website expose explicit, typed tools through `document.modelContext.registerTool()`. AgentReady makes that workflow accessible to Framer designers.

The current MVP can publish these tools:

- `search_site` — search visible headings, text, and links
- `search_collection` — search serialized Framer CMS content
- `get_collection_item` — retrieve a CMS item by slug
- `navigate_to` — navigate within the origin or reveal a section
- `prefill_form` — prepare form values without submitting
- `submit_form` — optional side-effecting form submission

## Product flow

```text
Scan project → Review capabilities → Publish tools → Test with an agent
```

The plugin reads the current canvas and CMS collections, generates a compact runtime configuration, and installs a top-level `<script>` using `framer.setCustomCode()`. No separate MCP server is required.

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
```

`npm test` validates that generated Custom Code is syntactically valid JavaScript and safely escapes inline data.

## Testing WebMCP

1. Open the plugin in a Framer website project.
2. Review the scan results and enabled capabilities.
3. Select **Publish tools**.
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

## Current limitations

- CMS content is snapshotted when tools are published; re-run the plugin after CMS updates.
- Form detection is heuristic and runtime form fields must expose a `name`, `id`, or `aria-label`.
- Site scanning currently covers the active canvas plus project CMS collections.
- WebMCP remains experimental and browser support varies.

## Project status

This repository is an early MVP created for the OpenAI WebMCP Challenge. The next planned steps are a tool editor, runtime diagnostics, live agent testing, and usage analytics.

## License

[MIT](LICENSE)
