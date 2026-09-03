import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { buildWebMcpCustomCode } from "../src/runtime"
import type { RuntimeConfig } from "../src/types"

const config: RuntimeConfig = {
  version: 1,
  projectName: "Demo </script><script>alert('unsafe')</script>",
  generatedAt: "2026-09-03T12:00:00.000Z",
  capabilities: ["siteSearch", "cmsSearch", "navigation", "formFill", "formSubmit"],
  collections: [{
    id: "products",
    name: "Products",
    fields: [{ id: "name", name: "Name", type: "string" }],
    items: [{ slug: "agent-kit", draft: false, fields: { Name: "Agent Kit" } }],
  }],
}

const html = buildWebMcpCustomCode(config)
assert.ok(html.startsWith('<script id="agentready-webmcp">'))
assert.ok(html.endsWith("</script>"))
assert.equal((html.match(/<script/g) ?? []).length, 1, "inline data must not open another script tag")
assert.ok(html.includes("\\u003c/script\\u003e"), "inline data must escape closing script tags")

for (const tool of ["search_site", "search_collection", "get_collection_item", "navigate_to", "prefill_form", "submit_form"]) {
  assert.ok(html.includes(`name: "${tool}"`), `missing ${tool}`)
}

const source = html.replace(/^<script id="agentready-webmcp">\n/, "").replace(/\n<\/script>$/, "")
new Function(source)

interface RegisteredTool {
  name: string
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>
}

const dom = new JSDOM(`<!doctype html>
  <html><body>
    <h1 id="welcome">Agent-ready commerce</h1>
    <p>Find the right product without hunting through filters.</p>
    <a href="/pricing">See pricing</a>
    <form>
      <input name="email" aria-label="email" />
      <textarea name="message" aria-label="message"></textarea>
    </form>
  </body></html>`, {
  url: "https://example.com/",
  runScripts: "outside-only",
})

const registered = new Map<string, RegisteredTool>()
Object.defineProperty(dom.window.document, "modelContext", {
  value: {
    registerTool(tool: RegisteredTool) {
      registered.set(tool.name, tool)
      return Promise.resolve()
    },
  },
})
Object.defineProperty(dom.window, "CSS", { value: { escape: (value: string) => value } })
Object.defineProperty(dom.window.Element.prototype, "scrollIntoView", { value() {} })
dom.window.eval(source)

assert.equal(registered.size, 6)

const siteResult = await registered.get("search_site")?.execute({ query: "product" })
assert.equal(siteResult?.count, 1)

const cmsResult = await registered.get("search_collection")?.execute({ query: "Agent Kit" })
assert.equal(cmsResult?.count, 1)

const itemResult = await registered.get("get_collection_item")?.execute({ slug: "agent-kit" })
assert.equal(itemResult?.found, true)

const fillResult = await registered.get("prefill_form")?.execute({
  values: { email: "agent@example.com", message: "Book a demo" },
})
assert.equal(fillResult?.filled, true)
assert.equal((dom.window.document.querySelector('[name="email"]') as HTMLInputElement).value, "agent@example.com")
assert.equal((dom.window.document.querySelector('[name="message"]') as HTMLTextAreaElement).value, "Book a demo")

console.log("AgentReady runtime validation passed")
