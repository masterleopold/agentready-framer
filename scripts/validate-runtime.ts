import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { buildWebMcpCustomCode } from "../src/runtime"
import type { RuntimeConfig } from "../src/types"

const expectedTools = [
  "search_site", "search_collection", "get_collection_item", "navigate_to",
  "inspect_forms", "prefill_form", "fill_address", "select_form_options",
  "set_form_date", "advance_form_step", "prepare_file_upload",
  "read_conversation", "compose_chat_message", "send_chat_message",
  "search_shopify_products", "inspect_shopify_cart", "add_shopify_cart_line", "update_shopify_cart", "prepare_shopify_checkout",
  "inspect_agentic_offers", "request_agentic_payment",
  "discover_paid_content",
  "inspect_checkout", "prepare_checkout", "submit_form",
]

const config: RuntimeConfig = {
  version: 1,
  projectName: "Demo </script><script>alert('unsafe')</script>",
  generatedAt: "2026-09-03T12:00:00.000Z",
  capabilities: ["siteSearch", "cmsSearch", "navigation", "formFill", "conversation", "chatSend", "checkoutAssist", "shopifyCommerce", "agenticPayments", "payPerCrawl", "formSubmit"],
  collections: [{
    id: "products",
    name: "Products",
    fields: [{ id: "name", name: "Name", type: "string" }],
    items: [{ slug: "agent-kit", draft: false, fields: { Name: "Agent Kit" } }],
  }],
  shopify: { storeDomain: "agentready.myshopify.com", publicAccessToken: "public-demo-token", apiVersion: "2026-07" },
  cloudflarePayments: { endpoint: "https://agentready-payments.workers.dev" },
  crawlMonetization: { currency: "USD", pricePerRequest: "0.01", purposes: { search: true, aiInput: true, aiTrain: false }, contentUse: "reference" },
}

const html = buildWebMcpCustomCode(config)
assert.ok(html.startsWith('<script id="agentready-webmcp">'))
assert.ok(html.endsWith("</script>"))
assert.equal((html.match(/<script/g) ?? []).length, 1, "inline data must not open another script tag")
assert.ok(html.includes("\\u003c/script\\u003e"), "inline data must escape closing script tags")
for (const tool of expectedTools) assert.ok(html.includes(`name: "${tool}"`), `missing ${tool}`)

const source = html.replace(/^<script id="agentready-webmcp">\n/, "").replace(/\n<\/script>$/, "")
new Function(source)

interface RegisteredTool {
  name: string
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
    <label>Full name <input name="fullName" autocomplete="name"></label>
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

const registered = new Map<string, RegisteredTool>()
Object.defineProperty(dom.window.document, "modelContext", { value: { registerTool(tool: RegisteredTool) { registered.set(tool.name, tool) } } })
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
Object.defineProperty(dom.window, "fetch", { value: async (url: string, init?: { body?: string }) => {
  if (url.includes("agentready-payments.workers.dev/v1/offers/agentready-creator/purchase")) return {
    ok: false, status: 402,
    headers: { get: (name: string) => name.toLowerCase() === "www-authenticate" ? "Payment id=demo" : null },
    json: async () => ({ error: "Payment required" }),
  }
  if (url.endsWith("/v1/offers")) return {
    ok: true, status: 200, headers: { get: () => null },
    json: async () => ({ offers: [{ id: "agentready-creator", amount: "49" }] }),
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
assert.deepEqual([...registered.keys()], expectedTools)

const run = (name: string, input: Record<string, unknown> = {}) => registered.get(name)!.execute(input)

assert.equal((await run("search_site", { query: "multi-step" })).count, 1)
assert.equal((await run("search_collection", { query: "Agent Kit" })).count, 1)
assert.equal((await run("get_collection_item", { slug: "agent-kit" })).found, true)

const inspected = await run("inspect_forms")
assert.equal(inspected.count, 3)
const inspectedForms = inspected.forms as Array<{ fields: InspectedField[] }>
const checkoutCard = inspectedForms[1].fields.find((field) => field.key === "cardNumber")!
assert.equal(checkoutCard.sensitive, true)
assert.equal(checkoutCard.value, undefined)

const filled = await run("prefill_form", { formIndex: 0, values: { fullName: "Ada Lovelace", plan: "pro", interests: ["design", "ai"], budget: 80 } })
assert.equal(filled.filled, true)
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

const products = await run("search_shopify_products", { query: "agent", first: 5 })
assert.equal(products.count, 1)
const added = await run("add_shopify_cart_line", { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 })
assert.equal(added.added, true)
assert.equal((await run("inspect_shopify_cart")).cart !== null, true)
const shopifyCheckout = await run("prepare_shopify_checkout")
assert.equal(shopifyCheckout.ready, true)
assert.equal(shopifyCheckout.requiresUserAction, true)
assert.equal((await run("inspect_agentic_offers")).available, true)
const payment = await run("request_agentic_payment", { offerId: "agentready-creator" })
assert.equal(payment.paymentRequired, true)
assert.equal(payment.protocol, "MPP")
const crawlPolicy = await run("discover_paid_content")
assert.equal((crawlPolicy.pricing as { amount: string }).amount, "0.01")
assert.equal((crawlPolicy.permittedPurposes as string[]).includes("ai-train"), false)
assert.equal((crawlPolicy.discovery as string), "https://example.com/.well-known/agentready.json")
assert.equal((crawlPolicy.schema as string), "https://example.com/agentready/schema.json")
assert.ok((crawlPolicy.evidence as string[]).includes("content license"))

const checkout = await run("inspect_checkout")
assert.equal(checkout.count, 1)
assert.ok(((checkout.policy as { humanOnly: string[] }).humanOnly).includes("final payment confirmation"))
const prepared = await run("prepare_checkout", { formIndex: 1, values: { billingEmail: "ada@example.com", cardNumber: "4111111111111111", cvv: "999" } })
assert.equal(prepared.prepared, true)
assert.equal((prepared.blocked as unknown[]).length, 2)
assert.equal((dom.window.document.querySelector('[name="billingEmail"]') as HTMLInputElement).value, "ada@example.com")
assert.equal((await run("submit_form", { formIndex: 1 })).submitted, false)

console.log("AgentReady runtime validation passed: 25 tools, forms, chat, Shopify, payments, and crawl policy")
