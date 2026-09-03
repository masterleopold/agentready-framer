import assert from "node:assert/strict"
import intelligence from "../cloudflare/src/intelligence"

const originalFetch = globalThis.fetch
const searchQueries: string[] = []
const env = {
  ALLOWED_ORIGINS: "https://agentready.framer.website",
  AI_SEARCH_INSTANCE: "agentready-site",
  CONTENT_LICENSE_URL: "https://agentready.framer.website/terms",
  SHOPIFY_STORE_DOMAIN: "tkigey-1f.myshopify.com",
  AI_SEARCH: {
    get: () => ({
      search: async ({ query }: { query: string }) => {
        searchQueries.push(query)
        const contextual = query.includes("AgentReady Framer site documentation")
        return {
          search_query: query,
          chunks: contextual ? [{ id: "chunk-1", score: 0.72, text: "Payment credentials stay with the buyer.", item: { key: "agentready.framer.website-index.md", timestamp: 1_788_451_200, metadata: { source_url: "https://agentready.framer.website/" } } }] : [],
        }
      },
    }),
  },
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

  const knowledge = await intelligence.fetch(new Request("https://worker.example/v1/knowledge/search", {
    method: "POST",
    headers: { origin: "https://agentready.framer.website", "content-type": "application/json" },
    body: JSON.stringify({ query: "How are payments kept safe?", limit: 3 }),
  }), env, {} as ExecutionContext)
  assert.equal(knowledge.status, 200)
  const knowledgeBody = await knowledge.json() as { count?: number; contextualFallback?: boolean; requestedQuery?: string }
  assert.equal(knowledgeBody.count, 1)
  assert.equal(knowledgeBody.contextualFallback, true)
  assert.equal(knowledgeBody.requestedQuery, "How are payments kept safe?")
  assert.deepEqual(searchQueries, ["How are payments kept safe?", "How are payments kept safe? AgentReady Framer site documentation"])
} finally {
  globalThis.fetch = originalFetch
}

console.log("AgentReady Intelligence validation passed: public UCP profile, allowlisted Shopify MCP proxy, and contextual knowledge fallback")
