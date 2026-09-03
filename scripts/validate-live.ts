import assert from "node:assert/strict"
import { JSDOM, VirtualConsole } from "jsdom"

type RegisteredTool = {
  name: string
  execute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

const demoUrl = process.env.AGENTREADY_DEMO_URL
assert(demoUrl, "Set AGENTREADY_DEMO_URL to the published Framer page URL.")

const response = await fetch(demoUrl)
assert.equal(response.status, 200, `Demo returned HTTP ${response.status}.`)
const html = await response.text()
assert.match(html, /id="agentready-webmcp"/, "AgentReady custom code is missing.")
assert.equal(
  html.match(/id="agentready-webmcp"/g)?.length,
  1,
  "Expected exactly one AgentReady Custom Code installation.",
)

const tools: RegisteredTool[] = []
const virtualConsole = new VirtualConsole()
virtualConsole.on("error", () => undefined)
virtualConsole.on("jsdomError", () => undefined)

const dom = new JSDOM(html, {
  url: demoUrl,
  runScripts: "dangerously",
  virtualConsole,
  beforeParse(window) {
    Object.defineProperty(window.document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: RegisteredTool) {
          tools.push(tool)
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

const names = tools.map((tool) => tool.name).sort()
assert.deepEqual(names, [
  "advance_form_step",
  "compose_chat_message",
  "fill_address",
  "get_collection_item",
  "inspect_checkout",
  "inspect_forms",
  "navigate_to",
  "prefill_form",
  "prepare_checkout",
  "prepare_file_upload",
  "read_conversation",
  "search_collection",
  "search_site",
  "select_form_options",
  "send_chat_message",
  "set_form_date",
  "submit_form",
])

const searchSite = tools.find((tool) => tool.name === "search_site")
assert(searchSite)
const searchResult = await searchSite.execute({ query: "Framer" })
assert(Number(searchResult.count) > 0, "search_site returned no live-page matches.")

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

console.log(`AgentReady live validation passed: ${demoUrl}`)
console.log(`Registered tools: ${names.join(", ")}`)
