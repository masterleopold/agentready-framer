import assert from "node:assert/strict"
import crawlPricing from "../cloudflare/src/crawl-pricing"

const originalFetch = globalThis.fetch

try {
  globalThis.fetch = async () => new Response("<!doctype html><title>AgentReady</title>", {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "permissions-policy": "geolocation=()",
    },
  })

  const response = await crawlPricing.fetch(new Request("https://site.example/"), {
    CRAWLER_PRICE: "USD 0.01",
    PAID_PATH_PREFIXES: "/articles/",
    FRAMER_ORIGIN: "https://agentready.framer.website",
  }, {} as ExecutionContext)

  assert.equal(response.headers.get("origin-agent-cluster"), "?1")
  assert.equal(response.headers.get("permissions-policy"), "geolocation=(), tools=(self)")
  assert.match(await response.text(), /AgentReady/)
} finally {
  globalThis.fetch = originalFetch
}

console.log("AgentReady Cloudflare header validation passed: origin isolation and tools=(self)")
