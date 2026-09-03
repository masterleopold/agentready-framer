import assert from "node:assert/strict"
import gateway from "../cloudflare/src/mcp-gateway"

const env = { ALLOWED_ORIGINS: "https://site.example", CONTENT_LICENSE_URL: "https://site.example/terms" }
const rpc = (body: unknown, origin = "https://site.example") => gateway.fetch(new Request("https://site.example/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", origin, "sec-fetch-site": origin === "https://site.example" ? "same-origin" : "cross-site" },
  body: JSON.stringify(body),
}), env, {} as ExecutionContext)

const initialized = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
assert.equal(initialized.status, 200)
const initializePayload = await initialized.json() as { result: { protocolVersion: string } }
assert.equal(initializePayload.result.protocolVersion, "2025-06-18")

const listed = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })
const listPayload = await listed.json() as { result: { tools: Array<{ name: string; title?: string }> } }
assert.deepEqual(listPayload.result.tools.map((tool) => tool.name), ["agentready_edge_status", "discover_paid_content"])
assert.ok(listPayload.result.tools.every((tool) => tool.title?.length), "Gateway tools must expose user-facing titles")

const called = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "agentready_edge_status", arguments: {} } })
const callPayload = await called.json() as { result: { structuredContent: { ready: boolean; sameOrigin: boolean } } }
assert.equal(callPayload.result.structuredContent.ready, true)
assert.equal(callPayload.result.structuredContent.sameOrigin, true)

const unavailable = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "request_agentic_payment", arguments: { offerId: "demo" } } })
const unavailablePayload = await unavailable.json() as { error: { code: number } }
assert.equal(unavailablePayload.error.code, -32602)

const crossSite = await rpc({ jsonrpc: "2.0", id: 5, method: "tools/list" }, "https://attacker.example")
assert.equal(crossSite.status, 403)

const wrongType = await gateway.fetch(new Request("https://site.example/mcp", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" }), env, {} as ExecutionContext)
assert.equal(wrongType.status, 400)

console.log("AgentReady MCP gateway validation passed: initialize, discovery, calls, configuration filtering, and cross-site/body guards")
