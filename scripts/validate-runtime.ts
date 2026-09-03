import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { buildOriginTrialCustomCode, buildWebMcpCustomCode } from "../src/runtime"
import type { RuntimeConfig } from "../src/types"

const expectedTools = [
  "search_site", "search_site_knowledge", "answer_from_site", "get_content_provenance",
  "search_collection", "get_collection_item", "navigate_to",
  "inspect_forms", "prefill_form", "fill_address", "select_form_options",
  "set_form_date", "advance_form_step", "prepare_file_upload",
  "read_conversation", "compose_chat_message", "send_chat_message",
  "search_shopify_catalog", "lookup_shopify_catalog", "get_shopify_product", "search_shopify_policies", "get_shopify_cart", "update_shopify_cart", "prepare_shopify_checkout",
  "inspect_agentic_offers", "request_agentic_payment",
  "discover_paid_content",
  "inspect_checkout", "prepare_checkout", "submit_form",
]

const config: RuntimeConfig = {
  version: 1,
  projectName: "Demo </script><script>alert('unsafe')</script>",
  generatedAt: "2026-09-03T12:00:00.000Z",
  capabilities: ["siteSearch", "cmsSearch", "navigation", "formFill", "conversation", "chatSend", "checkoutAssist", "shopifyCommerce", "agenticPayments", "payPerCrawl", "cloudflareKnowledge", "formSubmit"],
  collections: [{
    id: "products",
    name: "Products",
    fields: [{ id: "name", name: "Name", type: "string" }],
    items: [{ slug: "agent-kit", draft: false, fields: { Name: "Agent Kit" } }],
  }],
  shopify: { storeDomain: "agentready.myshopify.com", connectionMode: "auto", agentProfile: "https://agentready.example/.well-known/ucp-agent.json", publicAccessToken: "public-demo-token", apiVersion: "2026-07" },
  cloudflarePayments: { endpoint: "https://agentready-payments.workers.dev" },
  cloudflareIntelligence: { endpoint: "https://agentready-intelligence.workers.dev", telemetry: true },
  crawlMonetization: { currency: "USD", pricePerRequest: "0.01", purposes: { search: true, aiInput: true, aiTrain: false }, contentUse: "reference" },
}

const html = buildWebMcpCustomCode(config)
assert.equal(buildOriginTrialCustomCode("  demo-token-with-enough-characters-1234567890+/=  "), '<meta id="agentready-webmcp-origin-trial" http-equiv="origin-trial" content="demo-token-with-enough-characters-1234567890+/=">')
assert.equal(buildOriginTrialCustomCode(""), null)
assert.ok(buildOriginTrialCustomCode('token-with-quote-"-and-ampersand-&')?.includes("&quot;-and-ampersand-&amp;"))
assert.ok(html.startsWith('<script id="agentready-webmcp">'))
assert.ok(html.endsWith("</script>"))
assert.equal((html.match(/<script/g) ?? []).length, 1, "inline data must not open another script tag")
assert.ok(html.includes("\\u003c/script\\u003e"), "inline data must escape closing script tags")
for (const tool of expectedTools) assert.ok(html.includes(`name: "${tool}"`), `missing ${tool}`)

const source = html.replace(/^<script id="agentready-webmcp">\n/, "").replace(/\n<\/script>$/, "")
new Function(source)

interface RegisteredTool {
  name: string
  title: string
  description: string
  inputSchema?: Record<string, unknown>
  annotations?: Record<string, boolean>
  execute(input?: Record<string, unknown>): Promise<Record<string, unknown>>
}

interface InspectedField { key: string; sensitive: boolean; value?: unknown }
interface ConversationMessage { role: string; text: string }

const dom = new JSDOM(`<!doctype html><html><body>
  <h1>Agent-ready applications</h1>
  <p>Complete a multi-step application with an agent.</p>
  <a href="/pricing">See pricing</a>

  <form id="application" aria-label="Application wizard">
    <span aria-current="step">Step 1 of 3</span>
    <label>Full name <input name="fullName" autocomplete="name" required></label>
    <label>Street <input name="street" autocomplete="shipping address-line1"></label>
    <label>City <input name="city" autocomplete="shipping address-level2"></label>
    <label>Postal code <input name="postal" autocomplete="shipping postal-code"></label>
    <label>Country <select name="country" autocomplete="shipping country"><option value="JP">Japan</option><option value="US">United States</option></select></label>
    <fieldset><legend>Plan</legend>
      <label><input type="radio" name="plan" value="basic"> Basic</label>
      <label><input type="radio" name="plan" value="pro"> Pro</label>
    </fieldset>
    <fieldset><legend>Interests</legend>
      <label><input type="checkbox" name="interests" value="design"> Design</label>
      <label><input type="checkbox" name="interests" value="ai"> AI</label>
    </fieldset>
    <label>Start date <input type="date" name="startDate"></label>
    <label>End date <input type="date" name="endDate"></label>
    <label>Appointment time <input type="time" name="appointmentTime"></label>
    <label>Budget <input type="range" name="budget" min="0" max="100" step="10"></label>
    <label>Resume <input type="file" name="resume" accept=".pdf"></label>
    <button id="next" type="button">Next</button>
  </form>

  <section hidden aria-label="Inactive Framer breakpoint">
    <form id="duplicate-application"><label>Duplicate <input name="duplicate"></label></form>
  </section>

  <form toolname="declarative_contact" tooldescription="Prepare a contact request.">
    <label>Email <input name="email" toolparamdescription="Where the reply should be sent."></label>
    <button type="submit">Prepare</button>
  </form>

  <form id="checkout" aria-label="Payment checkout">
    <label>Billing email <input name="billingEmail" autocomplete="billing email"></label>
    <label>Card number <input name="cardNumber" autocomplete="cc-number" value="4242424242424242"></label>
    <label>CVV <input name="cvv" autocomplete="cc-csc" value="123"></label>
    <button type="submit">Pay now</button>
  </form>

  <section aria-label="Assistant chat">
    <div role="log" id="chat-log">
      <div data-message-author-role="user">I need help choosing a plan.</div>
      <div data-message-author-role="assistant">What is your expected team size?</div>
    </div>
    <form id="chat-form">
      <label>Chat message <textarea name="message" aria-label="Chat message"></textarea></label>
      <button type="submit" aria-label="Send">Send</button>
    </form>
  </section>
</body></html>`, { url: "https://example.com/", runScripts: "outside-only" })

for (let index = 0; index < 8; index += 1) {
  const paragraph = dom.window.document.createElement("p")
  paragraph.textContent = `oversized result ${index} ${"x".repeat(500)}`
  dom.window.document.body.append(paragraph)
}

const registered = new Map<string, RegisteredTool>()
const registrationSignals: AbortSignal[] = []
Object.defineProperty(dom.window.document, "modelContext", { value: { registerTool(tool: RegisteredTool, options: { signal: AbortSignal }) { registered.set(tool.name, tool); registrationSignals.push(options.signal); return Promise.resolve() } } })
Object.defineProperty(dom.window, "CSS", { value: { escape: (value: string) => value } })
Object.defineProperty(dom.window.Element.prototype, "scrollIntoView", { value() {} })
const shopifyCart = {
  id: "gid://shopify/Cart/demo?key=secret",
  checkoutUrl: "https://agentready.myshopify.com/checkouts/demo",
  totalQuantity: 1,
  note: null,
  discountCodes: [],
  cost: { subtotalAmount: { amount: "29.00", currencyCode: "USD" }, totalAmount: { amount: "29.00", currencyCode: "USD" } },
  lines: { nodes: [{ id: "gid://shopify/CartLine/1", quantity: 1, merchandise: { id: "gid://shopify/ProductVariant/1", title: "Default", product: { handle: "agent-kit", title: "Agent Kit" }, price: { amount: "29.00", currencyCode: "USD" }, selectedOptions: [] } }] },
}
const telemetryPayloads: Array<Record<string, unknown>> = []
const shopifyMcpPayloads: Array<Record<string, unknown>> = []
let shopifyStandardRateLimits = 0
Object.defineProperty(dom.window, "fetch", { value: async (url: string, init?: { body?: string }) => {
  if (url.endsWith("/v1/telemetry")) {
    telemetryPayloads.push(JSON.parse(init?.body ?? "{}") as Record<string, unknown>)
    return { ok: true, status: 204, headers: { get: () => null }, json: async () => ({}) }
  }
  if (url.endsWith("/v1/knowledge/search")) return {
    ok: true, status: 200, headers: { get: () => null },
    json: async () => ({ query: "agent", results: [{ source: "https://example.com/docs", text: "AgentReady knowledge" }], count: 1, index: "agentready-site" }),
  }
  if (url.endsWith("/v1/knowledge/answer")) return {
    ok: true, status: 200, headers: { get: () => null },
    json: async () => ({ answer: "AgentReady makes Framer sites agent-ready. [1]", sources: [{ source: "https://example.com/docs" }] }),
  }
  if (url.endsWith("/v1/provenance")) return {
    ok: true, status: 200, headers: { get: () => null },
    json: async () => ({ canonical: "https://example.com/", contentDigest: "sha-256=:demo:", license: "https://example.com/terms" }),
  }
  if (url.includes("agentready-payments.workers.dev/v1/offers/agentready-creator/purchase")) return {
    ok: false, status: 402,
    headers: { get: (name: string) => name.toLowerCase() === "www-authenticate" ? "Payment id=demo" : null },
    json: async () => ({ error: "Payment required" }),
  }
  if (url.endsWith("/v1/offers")) return {
    ok: true, status: 200, headers: { get: () => null },
    json: async () => ({ offers: [{ id: "agentready-creator", amount: "49" }] }),
  }
  if (url.includes("agentready.myshopify.com/api/mcp") || url.includes("agentready.myshopify.com/api/ucp/mcp")) {
    const payload = JSON.parse(init?.body ?? "{}") as { method: string; params?: { name?: string; arguments?: Record<string, unknown> } }
    shopifyMcpPayloads.push(payload as unknown as Record<string, unknown>)
    const ucp = url.includes("/api/ucp/mcp")
    const tools = ucp
      ? ["search_catalog", "lookup_catalog", "get_product"]
      : ["search_shop_policies_and_faqs", "get_cart", "update_cart"]
    if (payload.method === "tools/list" && !ucp && shopifyStandardRateLimits++ === 0) return {
      ok: false, status: 429, headers: { get: (name: string) => name === "Retry-After" ? "0" : null }, json: async () => ({ error: "rate limited" }),
    }
    if (payload.method === "tools/list") return {
      ok: true, status: 200, headers: { get: () => null },
      json: async () => ({ jsonrpc: "2.0", id: 1, result: { tools: tools.map((name) => ({ name, inputSchema: { type: "object", properties: name === "update_cart" ? { add_items: { type: "array" } } : {} } })) } }),
    }
    const name = payload.params?.name
    let result: Record<string, unknown>
    if (name === "search_catalog") result = { ucp: { version: "2026-08-25" }, products: [{ id: "gid://shopify/Product/1", title: "Agent Kit", variants: [{ id: "gid://shopify/ProductVariant/1", title: "Default", price: { amount: 2900, currency: "USD" } }] }] }
    else if (name === "lookup_catalog" || name === "get_product") result = { product: { id: "gid://shopify/Product/1", title: "Agent Kit", variants: [{ id: "gid://shopify/ProductVariant/1" }] } }
    else if (name === "search_shop_policies_and_faqs") result = { answer: "Returns are accepted within 30 days." }
    else result = { cart_id: "gid://shopify/Cart/demo?key=secret", checkout_url: "https://agentready.myshopify.com/checkouts/demo", total_quantity: 1, line_items: [{ id: "gid://shopify/CartLine/1", quantity: 1 }] }
    return {
      ok: true, status: 200, headers: { get: () => null },
      json: async () => ({ jsonrpc: "2.0", id: 2, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }),
    }
  }
  assert.ok(init?.body)
  const { query } = JSON.parse(init.body) as { query: string }
  let data: Record<string, unknown>
  if (query.includes("AgentReadyProducts")) data = { products: { nodes: [{ id: "gid://shopify/Product/1", handle: "agent-kit", title: "Agent Kit", variants: { nodes: [{ id: "gid://shopify/ProductVariant/1", title: "Default", availableForSale: true }] } }] } }
  else if (query.includes("AgentReadyCartCreate")) data = { cartCreate: { cart: shopifyCart, userErrors: [], warnings: [] } }
  else data = { cart: shopifyCart }
  return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ data }) }
} })

let nextClicks = 0
dom.window.document.querySelector("#next")?.addEventListener("click", () => { nextClicks += 1 })
dom.window.document.querySelector("#chat-form")?.addEventListener("submit", (event) => {
  event.preventDefault()
  const input = dom.window.document.querySelector('[name="message"]') as HTMLTextAreaElement
  const log = dom.window.document.querySelector("#chat-log")!
  log.insertAdjacentHTML("beforeend", `<div data-message-author-role="user">${input.value}</div><div data-message-author-role="assistant">The Pro plan fits a growing team.</div>`)
})

dom.window.eval(source)
const registrationStatus = await (dom.window as unknown as { __agentReadyRegistration: Promise<{ ready: boolean; registered: number }> }).__agentReadyRegistration
assert.deepEqual([...registered.keys()], expectedTools)
assert.equal(registrationStatus.ready, true)
assert.equal(registrationStatus.registered, 30)
assert.equal(registrationSignals.length, 30)
assert.ok(registrationSignals.every((signal) => !signal.aborted))
for (const tool of registered.values()) {
  assert.match(tool.name, /^[A-Za-z0-9_.-]{1,30}$/)
  assert.ok(tool.title.length > 0, `${tool.name} must expose a user-facing title`)
  assert.ok(tool.description.length <= 500, `${tool.name} description exceeds Chrome's recommended budget`)
  assert.ok(Object.keys(tool.annotations ?? {}).every((key) => ["readOnlyHint", "untrustedContentHint"].includes(key)), `${tool.name} registered a non-standard WebMCP annotation`)
}

const inspectSchemaMetadata = (schema: Record<string, unknown> | undefined, path = "input") => {
  if (!schema) return
  if (typeof schema.description === "string") assert.ok(schema.description.length <= 150, `${path} description exceeds Chrome's recommended budget`)
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined
  for (const [name, child] of Object.entries(properties ?? {})) {
    assert.ok(name.length <= 30, `${path}.${name} exceeds Chrome's recommended name budget`)
    inspectSchemaMetadata(child, `${path}.${name}`)
  }
  const items = schema.items as Record<string, unknown> | undefined
  if (items) inspectSchemaMetadata(items, `${path}[]`)
  for (const keyword of ["anyOf", "oneOf", "allOf"] as const) {
    for (const child of (schema[keyword] as Array<Record<string, unknown>> | undefined) ?? []) inspectSchemaMetadata(child, path)
  }
}
for (const tool of registered.values()) inspectSchemaMetadata(tool.inputSchema)

const run = (name: string, input: Record<string, unknown> = {}) => registered.get(name)!.execute(input)

assert.equal((await run("search_site", { query: "multi-step" })).count, 1)
const oversized = await run("search_site", { query: "oversized" })
assert.equal(oversized.outcome, "truncated")
assert.equal(oversized.retryable, true)
assert.ok(JSON.stringify(oversized).length <= 1500)
const declarativeEvent = new dom.window.Event("toolactivated")
Object.defineProperty(declarativeEvent, "toolName", { value: "declarative_contact" })
dom.window.dispatchEvent(declarativeEvent)
assert.equal(dom.window.document.documentElement.dataset.agentreadyToolState, "active")
assert.equal((await run("search_site_knowledge", { query: "agent" })).count, 1)
assert.match(String((await run("answer_from_site", { question: "What is AgentReady?" })).answer), /Framer/)
assert.match(String((await run("get_content_provenance")).contentDigest), /^sha-256=/)
assert.equal((await run("search_collection", { query: "Agent Kit" })).count, 1)
assert.equal((await run("get_collection_item", { slug: "agent-kit" })).found, true)

const inspected = await run("inspect_forms")
assert.equal(inspected.count, 3)
const inspectedForms = inspected.forms as Array<{ formIndex: number; fieldCount: number; valid: boolean }>
assert.equal(inspectedForms[0].valid, false)
assert.ok(inspectedForms[0].fieldCount >= 12)
const inspectedApplication = await run("inspect_forms", { formIndex: 0, fieldLimit: 4 })
assert.equal((inspectedApplication.validation as { valid: boolean }).valid, false)
assert.equal(inspectedApplication.usesCurrentVisibleValues, true)
assert.equal(inspectedApplication.nextFieldOffset, 4)
const inspectedCheckout = await run("inspect_forms", { formIndex: 1, fieldLimit: 8 })
const checkoutCard = (inspectedCheckout.fields as InspectedField[]).find((field) => field.key === "cardNumber")!
assert.equal(checkoutCard.sensitive, true)
assert.equal(checkoutCard.value, undefined)

const filled = await run("prefill_form", { formIndex: 0, values: { fullName: "Ada Lovelace", plan: "pro", interests: ["design", "ai"], budget: 80 } })
assert.equal(filled.filled, true)
assert.equal((filled.validation as { valid: boolean }).valid, true)
assert.equal((dom.window.document.querySelector('[name="fullName"]') as HTMLInputElement).value, "Ada Lovelace")
assert.equal((dom.window.document.querySelector('[name="plan"][value="pro"]') as HTMLInputElement).checked, true)
assert.equal((dom.window.document.querySelector('[name="interests"][value="ai"]') as HTMLInputElement).checked, true)

const address = await run("fill_address", { formIndex: 0, scope: "shipping", address: { line1: "1-1 Marunouchi", city: "Chiyoda", postalCode: "100-0005", countryCode: "JP" } })
assert.equal(address.filled, true)
assert.equal((dom.window.document.querySelector('[name="street"]') as HTMLInputElement).value, "1-1 Marunouchi")
assert.equal((dom.window.document.querySelector('[name="country"]') as HTMLSelectElement).value, "JP")

const selected = await run("select_form_options", { formIndex: 0, selections: { plan: "basic", interests: ["design"] } })
assert.equal(selected.selected, true)
assert.equal((dom.window.document.querySelector('[name="plan"][value="basic"]') as HTMLInputElement).checked, true)

assert.equal((await run("set_form_date", { formIndex: 0, field: "startDate", value: "2026-09-10", endField: "endDate", endValue: "2026-09-12" })).updated, true)
assert.equal((dom.window.document.querySelector('[name="endDate"]') as HTMLInputElement).value, "2026-09-12")
assert.equal((await run("set_form_date", { formIndex: 0, field: "appointmentTime", value: "14:30", timeZone: "Asia/Tokyo" })).updated, true)
assert.equal((await run("advance_form_step", { formIndex: 0, action: "next" })).advanced, true)
assert.equal(nextClicks, 1)
assert.equal((await run("prepare_file_upload", { formIndex: 0, field: "resume" })).requiresUserAction, true)

const conversation = await run("read_conversation")
assert.equal((conversation.messages as ConversationMessage[]).map((message) => message.role).join(","), "user,assistant")
assert.equal((await run("compose_chat_message", { message: "We have 12 people." })).composed, true)
assert.equal((dom.window.document.querySelector('[name="message"]') as HTMLTextAreaElement).value, "We have 12 people.")
const sent = await run("send_chat_message", { message: "We have 12 people.", waitMilliseconds: 0 })
assert.equal(sent.sent, true)
assert.equal((sent.newMessages as ConversationMessage[]).at(-1)?.role, "assistant")

const products = await run("search_shopify_catalog", { query: "agent", limit: 5, context: { addressCountry: "jp", language: "ja", currency: "jpy" } })
assert.equal(products.transport, "ucp")
assert.equal((await run("lookup_shopify_catalog", { ids: ["gid://shopify/Product/1"] })).transport, "ucp")
assert.equal((await run("get_shopify_product", { id: "gid://shopify/Product/1", selected: [{ name: "Color", label: "Blue" }] })).transport, "ucp")
assert.equal((await run("search_shopify_policies", { query: "Returns?" })).sourcePolicy, "merchant-only")
const added = await run("update_shopify_cart", { lines: [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }] })
assert.equal(added.updated, true)
assert.equal(JSON.stringify(added).includes("key=secret"), false)
assert.equal((await run("get_shopify_cart")).cart !== null, true)
const shopifyCheckout = await run("prepare_shopify_checkout")
assert.equal(shopifyCheckout.ready, true)
assert.equal(shopifyCheckout.requiresUserAction, true)
const searchCall = shopifyMcpPayloads.find((payload) => (payload.params as { name?: string } | undefined)?.name === "search_catalog") as { params: { arguments: { meta: { "ucp-agent": { profile: string } }; catalog: { context: { address_country: string; language: string; currency: string } } } } }
assert.equal(searchCall.params.arguments.meta["ucp-agent"].profile, "https://agentready.example/.well-known/ucp-agent.json")
assert.deepEqual(searchCall.params.arguments.catalog.context, { address_country: "JP", language: "ja", currency: "JPY" })
const updateCall = shopifyMcpPayloads.find((payload) => (payload.params as { name?: string } | undefined)?.name === "update_cart") as { params: { arguments: { add_items: unknown[]; cart_id?: string } } }
assert.equal(updateCall.params.arguments.add_items.length, 1)
assert.equal(updateCall.params.arguments.cart_id, undefined)
assert.equal(shopifyMcpPayloads.filter((payload) => payload.method === "tools/list").length, 3, "one rate-limit retry plus one cached discovery per endpoint")
assert.equal(shopifyStandardRateLimits, 2)
assert.equal((await run("inspect_agentic_offers")).available, true)
const payment = await run("request_agentic_payment", { offerId: "agentready-creator" })
assert.equal(payment.paymentRequired, true)
assert.equal(payment.protocol, "MPP")
assert.equal(payment.credentialHeader, "Authorization: Payment")
assert.equal(payment.retryRequired, true)
assert.equal(JSON.stringify(payment).includes("private key"), false)
const crawlPolicy = await run("discover_paid_content")
assert.equal((crawlPolicy.pricing as { amount: string }).amount, "0.01")
assert.equal((crawlPolicy.permittedPurposes as string[]).includes("ai-train"), false)
assert.equal((crawlPolicy.discovery as string), "https://example.com/.well-known/agentready.json")
assert.equal((crawlPolicy.schema as string), "https://example.com/agentready/schema.json")
assert.ok((crawlPolicy.evidence as string[]).includes("content license"))

const checkout = await run("inspect_checkout")
assert.equal(checkout.count, 1)
assert.ok(((checkout.policy as { humanOnly: string[] }).humanOnly).includes("final payment confirmation"))
assert.equal((checkout.policy as { doNotAutomateHumanOnlyControls: boolean }).doNotAutomateHumanOnlyControls, true)
const payButton = dom.window.document.querySelector<HTMLButtonElement>("#checkout button")!
assert.equal(payButton.dataset.agentreadyHumanOnly, "true")
let syntheticPayClicks = 0
payButton.addEventListener("click", () => { syntheticPayClicks += 1 })
payButton.click()
assert.equal(syntheticPayClicks, 0, "synthetic activation of a human-only payment control must be blocked")
assert.equal(payButton.dataset.agentreadyAgentBlocked, "true")
const prepared = await run("prepare_checkout", { formIndex: 1, values: { billingEmail: "ada@example.com", cardNumber: "4111111111111111", cvv: "999" } })
assert.equal(prepared.prepared, true)
assert.equal((prepared.blocked as unknown[]).length, 2)
assert.equal((dom.window.document.querySelector('[name="billingEmail"]') as HTMLInputElement).value, "ada@example.com")
const refusedSubmission = await run("submit_form", { formIndex: 1 })
assert.equal(refusedSubmission.submitted, false)
assert.equal(refusedSubmission.outcome, "refused")
assert.equal(refusedSubmission.code, "sensitive_form")
await Promise.resolve()
assert.ok(telemetryPayloads.length > 0)
assert.deepEqual(Object.keys(telemetryPayloads[0]).sort(), ["durationMs", "event", "outcome", "session", "tool"])
assert.equal(JSON.stringify(telemetryPayloads).includes("ada@example.com"), false)
assert.equal(JSON.stringify(telemetryPayloads).includes("What is AgentReady?"), false)

const fallbackConfig: RuntimeConfig = {
  version: 1,
  projectName: "GraphQL fallback",
  generatedAt: "2026-09-03T12:00:00.000Z",
  capabilities: ["shopifyCommerce"],
  collections: [],
  shopify: { storeDomain: "agentready.myshopify.com", connectionMode: "graphql", publicAccessToken: "public-demo-token", apiVersion: "2026-07" },
}
const fallbackHtml = buildWebMcpCustomCode(fallbackConfig)
const fallbackSource = fallbackHtml.replace(/^<script id="agentready-webmcp">\n/, "").replace(/\n<\/script>$/, "")
const fallbackDom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://fallback.example/", runScripts: "outside-only" })
const fallbackTools = new Map<string, RegisteredTool>()
Object.defineProperty(fallbackDom.window.document, "modelContext", { value: { registerTool(tool: RegisteredTool) { fallbackTools.set(tool.name, tool) } } })
Object.defineProperty(fallbackDom.window, "fetch", { value: async (_url: string, init?: { body?: string; headers?: Record<string, string> }) => {
  assert.equal(init?.headers?.["X-Shopify-Storefront-Access-Token"], "public-demo-token")
  const { query } = JSON.parse(init?.body ?? "{}") as { query: string }
  let data: Record<string, unknown>
  if (query.includes("AgentReadyProducts")) data = { products: { nodes: [{ id: "gid://shopify/Product/1", title: "Agent Kit", variants: { nodes: [] } }] } }
  else if (query.includes("AgentReadyCartCreate")) data = { cartCreate: { cart: shopifyCart, userErrors: [] } }
  else data = { cart: shopifyCart }
  return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ data }) }
} })
fallbackDom.window.eval(fallbackSource)
assert.equal(fallbackTools.size, 7)
const runFallback = (name: string, input: Record<string, unknown> = {}) => fallbackTools.get(name)!.execute(input)
assert.equal((await runFallback("search_shopify_catalog", { query: "agent" })).transport, "graphql-fallback")
assert.equal((await runFallback("update_shopify_cart", { lines: [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }] })).updated, true)
assert.equal((await runFallback("get_shopify_cart")).transport, "graphql-fallback")
assert.equal((await runFallback("prepare_shopify_checkout")).ready, true)

function registrationsFor(delivery: NonNullable<RuntimeConfig["delivery"]>) {
  const deliveryConfig: RuntimeConfig = { ...config, delivery }
  const deliveryHtml = buildWebMcpCustomCode(deliveryConfig)
  const deliverySource = deliveryHtml.replace(/^<script id="agentready-webmcp">\n/, "").replace(/\n<\/script>$/, "")
  const deliveryDom = new JSDOM("<!doctype html><html><body><form><input name='name'></form></body></html>", { url: "https://delivery.example/", runScripts: "outside-only" })
  const deliveryTools = new Map<string, RegisteredTool>()
  Object.defineProperty(deliveryDom.window.document, "modelContext", { value: { registerTool(tool: RegisteredTool) { deliveryTools.set(tool.name, tool) } } })
  Object.defineProperty(deliveryDom.window, "CSS", { value: { escape: (value: string) => value } })
  deliveryDom.window.eval(deliverySource)
  return deliveryTools
}

const hybridTools = registrationsFor({ mode: "hybrid", mcpPath: "/mcp", contentCredentials: true })
for (const remote of ["search_site_knowledge", "answer_from_site", "get_content_provenance", "inspect_agentic_offers", "request_agentic_payment", "discover_paid_content", "search_shopify_catalog", "lookup_shopify_catalog", "get_shopify_product", "search_shopify_policies"]) assert.equal(hybridTools.has(remote), false, `Hybrid must reserve ${remote} for the gateway`)
for (const local of ["search_site", "inspect_forms", "prefill_form", "get_shopify_cart", "update_shopify_cart", "prepare_shopify_checkout"]) assert.equal(hybridTools.has(local), true, `Hybrid must retain ${local} locally`)
const cloudflareTools = registrationsFor({ mode: "cloudflare", mcpPath: "/mcp", contentCredentials: true })
assert.equal(cloudflareTools.size, 0, "Cloudflare Bridge mode must not register browser-local tools")

assert.equal(registered.size, 30)
console.log("AgentReady runtime validation passed: 30 direct tools, Hybrid de-duplication, Cloudflare Bridge isolation, Shopify MCP/UCP, forms, chat, payments, knowledge, provenance, telemetry, and crawl policy")
