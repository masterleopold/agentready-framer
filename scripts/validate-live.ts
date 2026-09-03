import assert from "node:assert/strict"
import { JSDOM, VirtualConsole } from "jsdom"

type RegisteredTool = {
  name: string
  title: string
  annotations?: Record<string, boolean>
  execute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

const demoUrl = process.env.AGENTREADY_DEMO_URL
assert(demoUrl, "Set AGENTREADY_DEMO_URL to the published Framer page URL.")

const response = await fetch(demoUrl)
assert.equal(response.status, 200, `Demo returned HTTP ${response.status}.`)
const html = await response.text()
assert.match(html, /id="agentready-webmcp"/, "AgentReady custom code is missing.")
const installations = [...html.matchAll(/<script id="agentready-webmcp">[\s\S]*?<\/script>/g)]
if (process.env.AGENTREADY_STRICT_INSTALLATION === "1") assert.equal(installations.length, 1, "Expected exactly one AgentReady Custom Code installation.")
const selectedInstallation = [...installations].sort((left, right) => {
  const generatedAt = (match: RegExpMatchArray) => Date.parse(match[0].match(/"generatedAt":"([^"]+)"/)?.[1] ?? "") || 0
  return generatedAt(left) - generatedAt(right)
}).at(-1)
assert(selectedInstallation, "No AgentReady runtime script could be selected.")
const selectedHtml = html.replace(/<script id="agentready-webmcp">[\s\S]*?<\/script>/g, "").replace("</body>", `${selectedInstallation[0]}</body>`)

const tools: RegisteredTool[] = []
const virtualConsole = new VirtualConsole()
virtualConsole.on("error", () => undefined)
virtualConsole.on("jsdomError", () => undefined)

const dom = new JSDOM(selectedHtml, {
  url: demoUrl,
  runScripts: "dangerously",
  virtualConsole,
  beforeParse(window) {
    Object.defineProperty(window, "fetch", {
      configurable: true,
      value: globalThis.fetch.bind(globalThis),
    })
    Object.defineProperty(window.document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: RegisteredTool) {
          tools.push(tool)
          return Promise.resolve()
        },
      },
    })
    Object.defineProperty(window, "CSS", {
      configurable: true,
      value: { escape: (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "\\$&") },
    })
    window.HTMLElement.prototype.scrollIntoView = () => undefined
  },
})

await new Promise((resolve) => setTimeout(resolve, 100))
const registration = (dom.window as unknown as { __agentReadyRegistration?: Promise<{ ready: boolean }> }).__agentReadyRegistration
if (registration) assert.equal((await registration).ready, true)

const names = tools.map((tool) => tool.name).sort()
assert.ok(tools.every((tool) => tool.title?.length > 0), "Every live tool must expose a title.")
assert.ok(tools.every((tool) => Object.keys(tool.annotations ?? {}).every((key) => ["readOnlyHint", "untrustedContentHint"].includes(key))), "Live tools must use only standard WebMCP annotations.")
assert.deepEqual(names, [
  "advance_form_step",
  "answer_from_site",
  "compose_chat_message",
  "discover_paid_content",
  "fill_address",
  "get_collection_item",
  "get_content_provenance",
  "get_shopify_cart",
  "get_shopify_product",
  "inspect_agentic_offers",
  "inspect_checkout",
  "inspect_forms",
  "lookup_shopify_catalog",
  "navigate_to",
  "prefill_form",
  "prepare_checkout",
  "prepare_file_upload",
  "prepare_shopify_checkout",
  "read_conversation",
  "request_agentic_payment",
  "search_collection",
  "search_shopify_catalog",
  "search_shopify_policies",
  "search_site",
  "search_site_knowledge",
  "select_form_options",
  "send_chat_message",
  "set_form_date",
  "submit_form",
  "update_shopify_cart",
])

const searchSite = tools.find((tool) => tool.name === "search_site")
assert(searchSite)
const searchResult = await searchSite.execute({ query: "Framer" })
// The live page now mentions Framer often enough to exceed the 1,500-character output budget, so the
// runtime may answer with its structured truncation envelope. Both shapes prove the tool searched the page.
if (searchResult.outcome === "truncated") {
  assert.equal(searchResult.retryable, true, "Truncated search_site result must be retryable.")
  assert(Number(searchResult.originalCharacters) > 1500, "Truncation reported without an oversized result.")
} else {
  assert(Number(searchResult.count) > 0, "search_site returned no live-page matches.")
}

const prefillForm = tools.find((tool) => tool.name === "prefill_form")
assert(prefillForm)
const fillResult = await prefillForm.execute({
  formIndex: 0,
  values: { buyerName: "Demo Agent", buyerEmail: "agent@example.com", organization: "AgentReady" },
})
assert.equal(fillResult.filled, true)
assert.deepEqual([...(fillResult.updated as string[])], ["buyerName", "buyerEmail", "organization"])

assert.equal(dom.window.document.querySelector<HTMLInputElement>('[name="buyerName"]')?.value, "Demo Agent")
assert.equal(dom.window.document.querySelector<HTMLInputElement>('[name="buyerEmail"]')?.value, "agent@example.com")

const searchShopify = tools.find((tool) => tool.name === "search_shopify_catalog")
assert(searchShopify)
const shopifyResult = await searchShopify.execute({ query: "AgentReady", limit: 5, context: { addressCountry: "JP", language: "en", currency: "JPY" } })
if (shopifyResult.outcome === "truncated") {
  assert.equal(shopifyResult.retryable, true)
  assert.match(String(shopifyResult.preview), /"transport":"ucp"/, "The live catalog did not use Shopify UCP.")
} else {
  assert.equal(shopifyResult.transport, "ucp", "The live product should use Shopify's native UCP catalog.")
}
const ucpResponse = await fetch("https://tkigey-1f.myshopify.com/api/ucp/mcp", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search_catalog", arguments: { meta: { "ucp-agent": { profile: "https://agentready-intelligence.hara-7b1.workers.dev/.well-known/ucp-agent.json" } }, catalog: { query: "AgentReady", context: { address_country: "JP", language: "en", currency: "JPY" }, pagination: { limit: 5 } } } } }),
})
assert.equal(ucpResponse.status, 200)
const ucpPayload = await ucpResponse.json() as { result?: { structuredContent?: { products?: Array<{ title?: string; variants?: unknown[] }> } } }
const ucpProducts = ucpPayload.result?.structuredContent?.products ?? []
assert.ok(ucpProducts.some((product) => product.title?.includes("AgentReady") && product.variants?.length === 3), "Shopify UCP did not return the live AgentReady product and its three variants.")

console.log(`AgentReady live validation passed: ${demoUrl}`)
if (installations.length > 1) console.warn(`Warning: ${installations.length} AgentReady Custom Code entries detected; validated the newest one. Remove duplicate plugin identities and rerun with AGENTREADY_STRICT_INSTALLATION=1.`)
console.log(`Registered tools: ${names.join(", ")}`)
