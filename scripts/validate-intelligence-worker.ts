import assert from "node:assert/strict"
import intelligence from "../cloudflare/src/intelligence"

const originalFetch = globalThis.fetch
const env = {
  ALLOWED_ORIGINS: "https://agentready.framer.website",
  AI_SEARCH_INSTANCE: "agentready-site",
  CONTENT_LICENSE_URL: "https://agentready.framer.website/terms",
  SHOPIFY_STORE_DOMAIN: "tkigey-1f.myshopify.com",
} as never

try {
  const profile = await intelligence.fetch(new Request("https://worker.example/.well-known/ucp-agent.json"), env, {} as ExecutionContext)
  assert.equal(profile.status, 200)
  assert.equal(profile.headers.get("access-control-allow-origin"), "*")
  const profileBody = await profile.json() as { ucp?: { version?: string } }
  assert.equal(profileBody.ucp?.version, "2026-08-25")

  let upstreamBody = ""
  globalThis.fetch = async (_input, init) => {
    upstreamBody = String(init?.body ?? "")
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }), {
      headers: { "content-type": "application/json" },
    })
  }
  const request = new Request("https://worker.example/v1/shopify/mcp", {
    method: "POST",
    headers: { origin: "https://agentready.framer.website", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  })
  const proxied = await intelligence.fetch(request, env, {} as ExecutionContext)
  assert.equal(proxied.status, 200)
  assert.equal(proxied.headers.get("x-agentready-shopify-proxy"), "standard-mcp")
  assert.equal(JSON.parse(upstreamBody).method, "tools/list")

  const forbidden = await intelligence.fetch(new Request("https://worker.example/v1/shopify/mcp", {
    method: "POST",
    headers: { origin: "https://agentready.framer.website", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "complete_checkout", arguments: {} } }),
  }), env, {} as ExecutionContext)
  assert.equal(forbidden.status, 403)
} finally {
  globalThis.fetch = originalFetch
}

console.log("AgentReady Intelligence validation passed: public UCP profile and allowlisted Shopify MCP proxy")
