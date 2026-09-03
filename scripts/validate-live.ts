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
  "get_collection_item",
  "navigate_to",
  "prefill_form",
  "search_collection",
  "search_site",
])

const searchSite = tools.find((tool) => tool.name === "search_site")
assert(searchSite)
const searchResult = await searchSite.execute({ query: "Framer" })
assert(Number(searchResult.count) > 0, "search_site returned no live-page matches.")

const prefillForm = tools.find((tool) => tool.name === "prefill_form")
assert(prefillForm)
const fillResult = await prefillForm.execute({
  values: { name: "Demo Agent", email: "agent@example.com", interest: "WebMCP" },
})
assert.equal(fillResult.filled, true)
assert.deepEqual([...(fillResult.updated as string[])], ["name", "email", "interest"])

assert.equal(dom.window.document.querySelector<HTMLInputElement>('[name="name"]')?.value, "Demo Agent")
assert.equal(dom.window.document.querySelector<HTMLInputElement>('[name="email"]')?.value, "agent@example.com")

console.log(`AgentReady live validation passed: ${demoUrl}`)
console.log(`Registered tools: ${names.join(", ")}`)
