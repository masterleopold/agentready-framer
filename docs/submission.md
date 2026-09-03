# WebMCP Challenge submission draft

## Project name

AgentReady for Framer

## Tagline

Make your Framer site agent-ready in five minutes.

## Live demo

https://make-aspects-824660.framer.app/agent-ready

## Source

https://github.com/masterleopold/agentready-framer

## Submission description

AgentReady is a no-code WebMCP Builder for Framer. It scans the site designers have already built — pages, links, CMS collections, and forms — and turns those existing structures into explicit, typed tools for AI agents.

Instead of asking every Framer creator to learn JavaScript, JSON Schema, and browser security details, AgentReady presents safe capabilities as switches. In the current MVP, creators can expose site search, CMS search and item lookup, same-origin navigation, and form prefilling. Form submission remains a separate capability and is disabled by default.

When the creator selects Install tools, AgentReady generates an imperative WebMCP runtime and places it in Framer Custom Code. It runs as top-level page JavaScript, requires no separate backend, excludes draft CMS entries, and travels with the normal Framer publishing workflow.

The live demo is itself a responsive Framer site created and edited through a Framer MCP server. Its AgentReady runtime exposes five default tools. The repository includes both isolated runtime tests and an end-to-end test that fetches the public Framer page, executes its installed Custom Code in a WebMCP-compatible model context, searches real page content, and prefills the real form fields.

AgentReady's larger vision is an Agent API Builder for Websites: a visual layer where site owners can design, test, publish, monitor, and improve the actions their websites offer to agents. Framer is the first distribution surface because its structured canvas and CMS make those actions understandable to creators without code.

## Suggested demo prompts

- “What tools does this site provide?”
- “Search this page for agent capability.”
- “Find CMS content about design.”
- “Fill the demo form with name Demo Agent, email agent@example.com, and interest WebMCP. Do not submit it.”
- “Navigate to the section about the live action target.”

## Video outline (under 3 minutes)

### 0:00–0:20 — Problem

Show a polished Framer site and explain that browser agents still have to infer actions from pixels and DOM structure. WebMCP solves that, but implementation is still developer-oriented.

### 0:20–0:55 — Builder

Open AgentReady in Framer. Show the automatic site scan, detected text/links/CMS/forms, capability switches, and the deliberately separate form-submit control.

### 0:55–1:15 — Install

Select Install tools. Show the three readiness checks: Runtime, Enabled, and Live URL. Publish the site through Framer.

### 1:15–2:20 — Agent demo

Open the public demo in a WebMCP-capable ChatGPT browser. Ask it to list tools, search page content, query CMS, and prefill the visible form. Emphasize that values are prepared for human review and are not submitted.

### 2:20–2:45 — Technical proof

Briefly show the open-source runtime, narrow input schemas, same-origin navigation guard, draft exclusion, and passing live test.

### 2:45–2:58 — Vision

Close with: “AgentReady turns every Framer creator into an agent API designer — no backend, no schema authoring, and no duplicate content model.”

## Judging points

- WebMCP leverage: real imperative tools registered by top-level page JavaScript.
- Execution: a working Framer plugin, deployed demo, five live tools, runtime tests, live E2E test, and CI.
- Impact: makes WebMCP accessible to a large no-code creator audience.
- Creativity: treats agent capabilities as a visual website-design primitive rather than a developer-only integration.
