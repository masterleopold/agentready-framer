# WebMCP specification audit

Reviewed on 2026-09-04 against [`webmachinelearning/webmcp` commit `55fb7ee`](https://github.com/webmachinelearning/webmcp/tree/55fb7ee2289679fbbbf3b1f8fc2f92daf96e6ba9). This document deliberately separates the current specification source from explainer-only proposals and open issues.

## Current specification baseline

| Specification requirement | AgentReady implementation |
| --- | --- |
| `document.modelContext` is available only in secure contexts | The generated script is a progressive enhancement and exits without changing the page when the API is unavailable |
| Tool names are 1–128 ASCII alphanumeric, `_`, `-`, or `.` characters | Registration validates every generated name before calling the browser API; AgentReady intentionally enforces the same grammar with a stricter 30-character cap |
| `registerTool()` returns a Promise and rejects duplicate or invalid definitions | AgentReady observes every registration Promise, records failures in `window.__agentReadyRegistration`, and emits `agentready:ready` only with the settled result |
| `title` is the user-facing label | Every local and gateway tool receives a non-empty human-readable title; English is the current fallback |
| `inputSchema` is JSON Schema and tool results must be JSON-serializable | Inputs use bounded schemas and `additionalProperties: false` where AgentReady owns the schema; tests execute every tool and inspect its result |
| `execute(input, { signal })` receives a cancellation signal | Network, Shopify, chat-wait, and other asynchronous paths forward or observe the signal |
| Registration accepts an `AbortSignal` that unregisters tools | One page-lifetime controller owns the complete local tool set and is aborted before reinstallation |
| Standard WebMCP annotations are `readOnlyHint` and `untrustedContentHint` | The registration adapter forwards only these two fields, even when internal policy metadata contains MCP-specific hints |
| The `tools` Permissions Policy defaults to `self` and the API requires an origin-keyed agent cluster | The optional Cloudflare HTML proxy explicitly adds `Permissions-Policy: tools=(self)` and `Origin-Agent-Cluster: ?1`; cross-origin exposure is not enabled. The direct `framer.website` demo cannot configure these response headers on its current free plan, so strict production conformance requires the Worker/custom-domain path or a Framer plan with custom headers |
| Registrations are tied to a fully-active document | AgentReady does not claim background persistence; navigation creates a new page runtime |

AgentReady deliberately tightens the first row to Chrome's security guidance: generated tool and parameter names may be at most 30 characters even though the specification permits 128. Tool descriptions are limited to 500 characters, parameter descriptions to 150, and each JSON-serialized result to 1,500 characters. These are Chrome recommendations, not additional WebMCP conformance requirements.

The draft also defines `getTools()`, `executeTool()`, `toolchange`, same-origin descendant discovery, and explicit cross-origin `exposedTo`/`fromOrigins`. AgentReady is a tool provider and does not need to invoke `getTools()` or `executeTool()`. It intentionally omits `exposedTo`, so it does not opt tools into cross-origin iframe discovery.

## Chrome 149+ origin-trial implementation

Chrome's origin trial exposes both the imperative and declarative APIs. AgentReady now:

- installs an optional first-party `origin-trial` meta token in Framer `headStart`, before the body runtime accesses the feature;
- feature-detects `document.modelContext`, because invalid, expired, origin-mismatched, or usage-limited tokens are ignored;
- supports flag-based local testing at `chrome://flags/#enable-webmcp-testing` without requiring a token;
- leaves forms with `toolname` to Chrome's declarative API, preventing an overlapping imperative form surface;
- provides visible active-state styling and mirrors `toolactivated` / `toolcancel` events for site diagnostics;
- exposes settled imperative registration state at `window.__agentReadyRegistration` for Chrome DevTools or the Model Context Tool Inspector.

The token is public activation metadata and must be registered for the exact first-party origin. It is not an API secret and it expires with the trial enrollment.

## Declarative API explainer and implementation boundary

The declarative proposal currently describes `toolname`, `tooldescription`, `toolparamdescription`, optional `toolautosubmit`, form response handling, and active-form pseudo-classes. The normative declarative section in `index.bs` remains a TODO, including schema synthesis and cross-document response behavior.

AgentReady therefore uses the imperative API for Framer custom controls, multi-step state, chat, commerce, and safety-sensitive forms. It interoperates with Chrome's origin-trial declarative implementation for simple native forms and never registers an overlapping declarative and imperative tool for the same form.

For accessible form discovery, AgentReady resolves `aria-labelledby`, then `aria-label`, then native labels, and separately returns `aria-describedby`, `aria-description`, or `toolparamdescription` text. This follows accessible-name semantics more closely while [the declarative mapping discussion](https://github.com/webmachinelearning/webmcp/issues/286) remains open.

## Open-issue responses

These are defensive AgentReady conventions, not claims that the proposals are standardized.

| Open issue | Risk or opportunity | AgentReady response |
| --- | --- | --- |
| [#288: an automation agent can approve its own page-side human step](https://github.com/webmachinelearning/webmcp/issues/288) | A host can call a tool and then click the page's approval or payment control | Sensitive and payment confirmation controls are marked `data-agentready-human-only`; untrusted synthetic click/submit events are blocked; tool results explicitly tell hosts not to automate them. Browser-level automation may still create trusted events, so this is defense in depth rather than a complete platform guarantee |
| [#282: no standardized structured refusal](https://github.com/webmachinelearning/webmcp/issues/282) | A successful result, intentional refusal, and validation failure are difficult for clients to distinguish | Policy refusals use an AgentReady envelope: `{ outcome: "refused", code, reason, retryable: false, requiresUserAction: true }`. This convention will be migrated if the specification adopts a native result type |
| [#157: pre-filled or user-modified form values](https://github.com/webmachinelearning/webmcp/issues/157) | An agent may overwrite or ignore current visible state | `inspect_forms` returns non-sensitive current values and `usesCurrentVisibleValues`; `submit_form` takes no replacement values and submits the reviewed DOM state |
| [#139: validation before submission](https://github.com/webmachinelearning/webmcp/issues/139) | The agent cannot tell whether prepared values satisfy native or asynchronous validation | Form inspection and preparation return a bounded validation summary. Submission refuses invalid forms and forms marked `aria-busy` or `data-validating` |
| [#255: tool collections and progressive disclosure](https://github.com/webmachinelearning/webmcp/issues/255) | Large flat tool lists increase context cost and selection errors | Site owners enable capability packs before publication; tools also require relevant page UI or configured services. AgentReady does not ship a speculative `registerCollection()` API |
| [#262: lost meaning when tools appear or disappear](https://github.com/webmachinelearning/webmcp/issues/262) | Binary tool presence hides authorization or workflow reasons | AgentReady keeps the configured document surface stable and returns explicit `available`, `reason`, `limitations`, or refusal fields when runtime state prevents an operation |
| [#73: bound developer-provided context](https://github.com/webmachinelearning/webmcp/issues/73) | Long metadata and results increase prompt-injection and context-bloat risk | Names are spec-bounded, input strings and arrays have explicit maxima, page/CMS/chat results are truncated and counted, and large paid content stays at the JSON endpoint |
| [#176 and #198: consequential/reversible and HITL hints](https://github.com/webmachinelearning/webmcp/issues/176) | `readOnlyHint` alone does not express review or confirmation policy | AgentReady does not send unstandardized WebMCP annotations. It separates prepare/send/submit tools, puts review requirements in descriptions and structured results, and blocks final financial actions |
| [#110: sensitive outputs](https://github.com/webmachinelearning/webmcp/issues/110) | No standardized sensitive-output annotation or secret reference exists | AgentReady never returns the sensitive value. Cart IDs are redacted, file bytes bypass model arguments, and wallet/payment credentials remain outside the page |
| [#276: language and direction](https://github.com/webmachinelearning/webmcp/issues/276) | Declarative natural-language metadata can lose language/direction | The demo declares its document language; imperative titles are explicit. Full per-locale tool-title authoring remains a product follow-up because the specification has not defined metadata language/direction fields |
| [#196: progress reporting](https://github.com/webmachinelearning/webmcp/issues/196) | Long-running calls are opaque | Current operations are bounded and abortable. AgentReady will not call the proposed `reportProgress()` until it exists in the specification and supported hosts |

## Proposals intentionally not implemented

- Service-worker WebMCP registration, persistent/background tools, session identifiers, and manifest discovery are described in a supplemental explainer, not the current normative API. AgentReady's Cloudflare gateway remains a normal remote MCP complement rather than pretending to be a standardized WebMCP service worker.
- Tool collections, skills, progress events, structured refusal types, sensitive hints, output schemas, user-interaction requests, consequential hints, and human-only-control attributes remain open proposals. AgentReady uses local conventions only where they improve safety without changing the browser API contract.
- Cross-origin tool exposure is disabled. A future opt-in must require both the `tools` Permissions Policy delegation and an explicit, validated `exposedTo` origin list.

Chrome documents a proposed `requestUserInteraction()` mechanism, but its contract remains under specification discussion. AgentReady does not feature-detect or call it yet; sensitive actions remain split into preparation, review, and human-only completion.

## Primary sources

- [WebMCP repository and explainer](https://github.com/webmachinelearning/webmcp)
- [Specification source (`index.bs`)](https://github.com/webmachinelearning/webmcp/blob/main/index.bs)
- [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Service-worker supplemental explainer](https://github.com/webmachinelearning/webmcp/blob/main/docs/service-workers.md)
- [Security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [Open issues](https://github.com/webmachinelearning/webmcp/issues)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP origin trial](https://developer.chrome.com/blog/ai-webmcp-origin-trial)
- [Chrome secure-tool guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Chrome best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
