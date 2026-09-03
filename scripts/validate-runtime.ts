import assert from "node:assert/strict"
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

console.log("AgentReady runtime validation passed")
