import { framer, useIsAllowedTo } from "@framer/plugin"
import { useCallback, useEffect, useMemo, useState } from "react"
import { buildWebMcpCustomCode } from "./runtime"
import type { CapabilityId, CmsCollectionSnapshot, RuntimeConfig, SiteScan } from "./types"
import "./App.css"

framer.showUI({ position: "top right", width: 390, height: 760 })

const CAPABILITIES: Array<{ id: CapabilityId; title: string; description: string; risk?: string }> = [
  { id: "siteSearch", title: "Search website", description: "Find matching text, sections, and links on the current page." },
  { id: "cmsSearch", title: "Read CMS content", description: "Search collections and retrieve items by slug." },
  { id: "navigation", title: "Navigate pages", description: "Open same-site pages and reveal matching sections." },
  { id: "formFill", title: "Advanced forms", description: "Handle steps, options, dates, and file handoff without submitting." },
  { id: "conversation", title: "Read & compose chat", description: "Read chatbot replies and prepare the next conversational turn." },
  { id: "chatSend", title: "Send chat messages", description: "Allow agents to send prepared messages and wait for a reply.", risk: "External action" },
  { id: "checkoutAssist", title: "Checkout assistant", description: "Prepare plans, billing, shipping, and coupons; secrets stay human-only." },
  { id: "shopifyCommerce", title: "Shopify commerce", description: "Search products, manage a Storefront cart, and hand off to Shopify Checkout." },
  { id: "agenticPayments", title: "Cloudflare payments", description: "Expose MPP payment challenges and receipts for agent-native paid offers." },
  { id: "payPerCrawl", title: "Pay Per Crawl · JSON", description: "Sell normalized Framer content as a provenance-rich JSON feed through Cloudflare." },
  { id: "cloudflareKnowledge", title: "Cloudflare intelligence", description: "Add AI Search answers, source provenance, anonymous tool analytics, and Browser Run verification." },
  { id: "formSubmit", title: "Submit non-payment forms", description: "Allow final submission except checkout, authentication, and sensitive forms.", risk: "Review carefully" },
]

const DEFAULT_CAPABILITIES: CapabilityId[] = ["siteSearch", "cmsSearch", "navigation", "formFill", "conversation", "checkoutAssist"]
const SETTINGS_KEY = "agentready:settings:v1"

function primitiveValue(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map(primitiveValue).slice(0, 20)
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    if ("value" in record) return primitiveValue(record.value)
    if ("alt" in record && typeof record.alt === "string") return record.alt
  }
  return undefined
}

async function scanCollections(): Promise<CmsCollectionSnapshot[]> {
  const collections = await framer.getCollections()
  return Promise.all(collections.map(async (collection) => {
    const [fields, items] = await Promise.all([collection.getFields(), collection.getItems()])
    const fieldsById = new Map(fields.map((field) => [field.id, field.name]))
    return {
      id: collection.id,
      name: collection.name,
      fields: fields.map((field) => ({ id: field.id, name: field.name, type: field.type })),
      items: items.slice(0, 250).map((item) => ({
        slug: item.slug,
        draft: item.draft,
        fields: Object.fromEntries(Object.entries(item.fieldData)
          .map(([fieldId, entry]) => [fieldsById.get(fieldId) ?? fieldId, primitiveValue(entry)])
          .filter((entry) => entry[1] !== undefined)),
      })),
    }
  }))
}

export function App() {
  const canPublish = useIsAllowedTo("setCustomCode")
  const canDeploy = useIsAllowedTo("publish")
  const canSaveSettings = useIsAllowedTo("setPluginData")
  const [scan, setScan] = useState<SiteScan | null>(null)
  const [enabled, setEnabled] = useState<CapabilityId[]>(DEFAULT_CAPABILITIES)
  const [status, setStatus] = useState<"idle" | "scanning" | "publishing" | "deploying">("idle")
  const [installed, setInstalled] = useState(false)
  const [disabledByUser, setDisabledByUser] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shopifyDomain, setShopifyDomain] = useState("")
  const [shopifyMode, setShopifyMode] = useState<"auto" | "mcp" | "graphql">("auto")
  const [shopifyAgentProfile, setShopifyAgentProfile] = useState("https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json")
  const [shopifyToken, setShopifyToken] = useState("")
  const [shopifyConnection, setShopifyConnection] = useState<{ state: "idle" | "testing" | "ready" | "error"; message: string }>({ state: "idle", message: "" })
  const [paymentEndpoint, setPaymentEndpoint] = useState("")
  const [intelligenceEndpoint, setIntelligenceEndpoint] = useState("")
  const [telemetryEnabled, setTelemetryEnabled] = useState(true)
  const [crawlPrice, setCrawlPrice] = useState("0.01")
  const [allowAiTraining, setAllowAiTraining] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<"direct" | "hybrid" | "cloudflare">("direct")
  const [mcpPath, setMcpPath] = useState("/mcp")
  const [contentCredentials, setContentCredentials] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const refreshInstallStatus = useCallback(async () => {
    const [customCode, publishInfo] = await Promise.all([
      framer.getCustomCode(),
      framer.getPublishInfo(),
    ])
    const bodyEnd = customCode.bodyEnd
    setInstalled(Boolean(bodyEnd.html?.includes("agentready-webmcp")))
    setDisabledByUser(bodyEnd.disabled)
    setPublishedUrl(publishInfo.production?.url ?? publishInfo.staging?.url ?? null)
  }, [])

  const runScan = useCallback(async () => {
    setStatus("scanning")
    setError(null)
    try {
      const [project, root, collections] = await Promise.all([framer.getProjectInfo(), framer.getCanvasRoot(), scanCollections()])
      const [textNodes, linkNodes] = await Promise.all([root.getNodesWithType("TextNode"), root.getNodesWithAttributeSet("link")])
      let nodes = 0
      let formCandidates = 0
      for await (const node of root.walk()) {
        nodes += 1
        if ("name" in node && typeof node.name === "string" && /form|contact|signup|register|予約|問い合わせ/i.test(node.name)) formCandidates += 1
      }
      setScan({ projectName: project.name, scannedAt: new Date().toISOString(), nodes, textLayers: textNodes.length, links: linkNodes.length, formCandidates, collections })
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not scan this project.")
    } finally {
      setStatus("idle")
    }
  }, [])

  useEffect(() => { void Promise.all([runScan(), refreshInstallStatus()]) }, [refreshInstallStatus, runScan])

  useEffect(() => {
    void framer.getPluginData(SETTINGS_KEY).then((stored) => {
      if (!stored) return
      try {
        const parsed = JSON.parse(stored) as Partial<{
          enabled: CapabilityId[]
          shopifyDomain: string
          shopifyMode: "auto" | "mcp" | "graphql"
          shopifyAgentProfile: string
          shopifyToken: string
          paymentEndpoint: string
          intelligenceEndpoint: string
          telemetryEnabled: boolean
          crawlPrice: string
          allowAiTraining: boolean
          deliveryMode: "direct" | "hybrid" | "cloudflare"
          mcpPath: string
          contentCredentials: boolean
        }>
        if (Array.isArray(parsed.enabled)) setEnabled(parsed.enabled.filter((id): id is CapabilityId => CAPABILITIES.some((capability) => capability.id === id)))
        if (typeof parsed.shopifyDomain === "string") setShopifyDomain(parsed.shopifyDomain)
        if (["auto", "mcp", "graphql"].includes(parsed.shopifyMode ?? "")) setShopifyMode(parsed.shopifyMode as "auto" | "mcp" | "graphql")
        if (typeof parsed.shopifyAgentProfile === "string") setShopifyAgentProfile(parsed.shopifyAgentProfile)
        if (typeof parsed.shopifyToken === "string") setShopifyToken(parsed.shopifyToken)
        if (typeof parsed.paymentEndpoint === "string") setPaymentEndpoint(parsed.paymentEndpoint)
        if (typeof parsed.intelligenceEndpoint === "string") setIntelligenceEndpoint(parsed.intelligenceEndpoint)
        if (typeof parsed.telemetryEnabled === "boolean") setTelemetryEnabled(parsed.telemetryEnabled)
        if (typeof parsed.crawlPrice === "string") setCrawlPrice(parsed.crawlPrice)
        if (typeof parsed.allowAiTraining === "boolean") setAllowAiTraining(parsed.allowAiTraining)
        if (["direct", "hybrid", "cloudflare"].includes(parsed.deliveryMode ?? "")) setDeliveryMode(parsed.deliveryMode as "direct" | "hybrid" | "cloudflare")
        if (typeof parsed.mcpPath === "string") setMcpPath(parsed.mcpPath)
        if (typeof parsed.contentCredentials === "boolean") setContentCredentials(parsed.contentCredentials)
      } catch {
        framer.notify("Saved AgentReady settings could not be read.", { variant: "warning" })
      }
    }).finally(() => setSettingsLoaded(true))
  }, [])

  useEffect(() => {
    if (!settingsLoaded || !canSaveSettings) return
    const timeout = window.setTimeout(() => {
      void framer.setPluginData(SETTINGS_KEY, JSON.stringify({ enabled, shopifyDomain, shopifyMode, shopifyAgentProfile, shopifyToken, paymentEndpoint, intelligenceEndpoint, telemetryEnabled, crawlPrice, allowAiTraining, deliveryMode, mcpPath, contentCredentials }))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [allowAiTraining, canSaveSettings, contentCredentials, crawlPrice, deliveryMode, enabled, intelligenceEndpoint, mcpPath, paymentEndpoint, settingsLoaded, shopifyAgentProfile, shopifyDomain, shopifyMode, shopifyToken, telemetryEnabled])

  const validShopifyDomain = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shopifyDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
  const validShopifyAgentProfile = /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(shopifyAgentProfile.trim())
  const validPaymentEndpoint = /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(paymentEndpoint.trim())
  const validIntelligenceEndpoint = /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(intelligenceEndpoint.trim())
  const validCrawlPrice = /^\d+(?:\.\d{1,6})?$/.test(crawlPrice) && Number(crawlPrice) > 0
  const validMcpPath = /^\/(?!\/)[^?#]*$/.test(mcpPath.trim())
  const testShopifyConnection = async () => {
    if (!validShopifyDomain || (shopifyMode !== "graphql" && !validShopifyAgentProfile)) return
    const storeDomain = shopifyDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
    setShopifyConnection({ state: "testing", message: "Discovering Shopify tools…" })
    try {
      if (shopifyMode === "graphql") {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (shopifyToken.trim()) headers["X-Shopify-Storefront-Access-Token"] = shopifyToken.trim()
        const response = await fetch(`https://${storeDomain}/api/2026-07/graphql.json`, { method: "POST", headers, body: JSON.stringify({ query: "query AgentReadyConnection { shop { name } }" }) })
        const payload = await response.json() as { data?: { shop?: { name?: string } }; errors?: Array<{ message?: string }> }
        if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `GraphQL returned ${response.status}`)
        setShopifyConnection({ state: "ready", message: `GraphQL ready · ${payload.data?.shop?.name || storeDomain}` })
        return
      }
      const discover = async (path: string) => {
        const response = await fetch(`https://${storeDomain}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }) })
        const payload = await response.json() as { result?: { tools?: Array<{ name?: string }> }; error?: { message?: string } }
        if (!response.ok || payload.error) throw new Error(payload.error?.message || `${path} returned ${response.status}`)
        return payload.result?.tools?.map((tool) => tool.name).filter(Boolean) ?? []
      }
      const [standard, ucp] = await Promise.all([discover("/api/mcp"), discover("/api/ucp/mcp")])
      const expected = ["get_cart", "update_cart", "search_shop_policies_and_faqs", "search_catalog", "lookup_catalog", "get_product"]
      const discovered = new Set([...standard, ...ucp])
      const missing = expected.filter((name) => !discovered.has(name))
      setShopifyConnection({ state: "ready", message: missing.length ? `${discovered.size} tools found · ${missing.length} unavailable` : "6 native Shopify tools discovered" })
    } catch (connectionError) {
      setShopifyConnection({ state: "error", message: `${connectionError instanceof Error ? connectionError.message : "Connection failed"}${shopifyMode === "auto" ? " · GraphQL fallback remains available" : ""}` })
    }
  }
  const effectiveEnabled = useMemo(() => enabled.filter((id) => {
    if (id === "cmsSearch") return Boolean(scan?.collections.length)
    if (id === "shopifyCommerce") return validShopifyDomain && (shopifyMode === "graphql" || validShopifyAgentProfile)
    if (id === "agenticPayments") return validPaymentEndpoint
    if (id === "cloudflareKnowledge") return validIntelligenceEndpoint
    if (id === "payPerCrawl") return validCrawlPrice
    return true
  }), [enabled, scan, shopifyMode, validCrawlPrice, validIntelligenceEndpoint, validPaymentEndpoint, validShopifyAgentProfile, validShopifyDomain])
  const directCount = effectiveEnabled.reduce((count, id) => count + ({
    siteSearch: 1,
    cmsSearch: 2,
    navigation: 1,
    formFill: 7,
    conversation: 2,
    chatSend: 1,
    checkoutAssist: 2,
    shopifyCommerce: 7,
    agenticPayments: 2,
    payPerCrawl: 1,
    cloudflareKnowledge: 3,
    formSubmit: 1,
  }[id] ?? 0), 0)
  const remoteToolCounts: Partial<Record<CapabilityId, number>> = { shopifyCommerce: 4, agenticPayments: 2, payPerCrawl: 1, cloudflareKnowledge: 3 }
  const remoteCount = 1 + effectiveEnabled.reduce((count, id) => count + (remoteToolCounts[id] ?? 0), 0)
  const edgePackCount = deliveryMode !== "direct" && contentCredentials ? 2 : 0
  const toolCount = (deliveryMode === "direct" ? directCount : deliveryMode === "hybrid" ? directCount + 1 : remoteCount) + edgePackCount

  const toggleCapability = (id: CapabilityId) => {
    setEnabled((current) => current.includes(id) ? current.filter((capability) => capability !== id) : [...current, id])
  }

  const publish = async () => {
    if (!scan) return
    setStatus("publishing")
    setError(null)
    try {
      const storeDomain = shopifyDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
      const config: RuntimeConfig = {
        version: 1,
        projectName: scan.projectName,
        generatedAt: new Date().toISOString(),
        delivery: { mode: deliveryMode, mcpPath: validMcpPath ? mcpPath.trim() : "/mcp", contentCredentials },
        capabilities: effectiveEnabled,
        collections: scan.collections,
        shopify: validShopifyDomain ? {
          storeDomain,
          connectionMode: shopifyMode,
          agentProfile: validShopifyAgentProfile ? shopifyAgentProfile.trim() : undefined,
          publicAccessToken: shopifyMode !== "mcp" ? shopifyToken.trim() || undefined : undefined,
          apiVersion: "2026-07",
        } : undefined,
        cloudflarePayments: validPaymentEndpoint ? { endpoint: paymentEndpoint.trim().replace(/\/$/, "") } : undefined,
        cloudflareIntelligence: validIntelligenceEndpoint ? { endpoint: intelligenceEndpoint.trim().replace(/\/$/, ""), telemetry: telemetryEnabled } : undefined,
        crawlMonetization: validCrawlPrice ? { currency: "USD", pricePerRequest: crawlPrice, purposes: { search: true, aiInput: true, aiTrain: allowAiTraining }, contentUse: allowAiTraining ? "full" : "reference" } : undefined,
      }
      await framer.setCustomCode({ html: buildWebMcpCustomCode(config), location: "bodyEnd" })
      await refreshInstallStatus()
      framer.notify(`Published ${toolCount} WebMCP tools`, { variant: "success" })
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish WebMCP tools.")
    } finally {
      setStatus("idle")
    }
  }

  const deploySite = async () => {
    setStatus("deploying")
    setError(null)
    try {
      const result = await framer.publish()
      let deployment = result.deployment
      for (let attempt = 0; attempt < 15 && (deployment.status === "pending" || deployment.status === "optimizing"); attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
        deployment = await framer.getDeployment(deployment.id)
      }
      if (deployment.status === "failed") throw new Error(`Framer publishing failed during ${deployment.failureStage}.`)
      await refreshInstallStatus()
      framer.notify(deployment.status === "ready" ? "Site published and ready to test" : "Site publish started", { variant: "success" })
    } catch (deployError) {
      setError(deployError instanceof Error ? deployError.message : "Could not publish this Framer site.")
    } finally {
      setStatus("idle")
    }
  }

  const removeTools = async () => {
    if (!window.confirm("Remove AgentReady WebMCP Custom Code from this site? The site must be published again for visitors to receive the change.")) return
    setStatus("publishing")
    setError(null)
    try {
      await framer.setCustomCode({ html: null, location: "bodyEnd" })
      await refreshInstallStatus()
      framer.notify("AgentReady WebMCP tools removed", { variant: "success" })
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove WebMCP tools.")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <main>
      <header className="hero">
        <div><div className="eyebrow">AGENTREADY</div><h1>Make this site agent-ready.</h1></div>
        <span className={`status-dot ${installed ? "live" : ""}`} title={installed ? "Installed" : "Not installed"} />
      </header>

      <section className="scan-card">
        <div className="scan-card-top">
          <div><div className="section-label">SITE SCAN</div><strong>{scan?.projectName ?? "Reading project…"}</strong></div>
          <button className="icon-button" onClick={() => void runScan()} disabled={status !== "idle"} aria-label="Scan again">↻</button>
        </div>
        {scan ? <div className="scan-stats">
          <div><b>{scan.textLayers}</b><span>Text</span></div><div><b>{scan.links}</b><span>Links</span></div>
          <div><b>{scan.collections.length}</b><span>CMS</span></div><div><b>{scan.formCandidates}</b><span>Forms</span></div>
        </div> : <div className="scan-skeleton" />}
      </section>

      <section className="integration-settings delivery-settings">
        <div className="section-label">WEBMCP DELIVERY</div>
        <select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as "direct" | "hybrid" | "cloudflare")} aria-label="WebMCP delivery mode">
          <option value="direct">Direct · Framer Custom Code</option>
          <option value="hybrid">Hybrid · Local UI + Cloudflare /mcp</option>
          <option value="cloudflare">Cloudflare Bridge · Remote tools only</option>
        </select>
        {deliveryMode !== "direct" && <>
          <input value={mcpPath} onChange={(event) => setMcpPath(event.target.value)} placeholder="/mcp" aria-label="Same-origin MCP path" />
          <label className="compact-check"><input type="checkbox" checked={contentCredentials} onChange={(event) => setContentCredentials(event.target.checked)} />Enable Cloudflare Content Credentials pack</label>
          <p className={validMcpPath ? "connection-result" : "connection-error"}>{validMcpPath ? "Configure this same-origin path and selected packs in Cloudflare Agent Readiness → WebMCP." : "Use a same-origin absolute path such as /mcp."}</p>
          {contentCredentials && <p>C2PA tools decode embedded provenance metadata; the preview pack reports signatureVerified: false and is not cryptographic verification.</p>}
        </>}
        {deliveryMode === "direct" && <p>All tools run in the visitor browser. Hybrid is recommended when the site is behind Cloudflare.</p>}
      </section>

      <section className="capabilities">
        <div className="section-heading"><div><div className="section-label">AGENT CAPABILITIES</div><p>Choose what agents can do on the published site.</p></div><span>{toolCount} tools</span></div>
        <div className="capability-list">
          {CAPABILITIES.map((capability) => {
            const checked = enabled.includes(capability.id)
            const unavailable = capability.id === "cmsSearch" && scan?.collections.length === 0
            return <label className={`capability ${unavailable ? "unavailable" : ""}`} key={capability.id}>
              <span className="capability-copy"><span className="capability-title">{capability.title}{capability.risk && <em>{capability.risk}</em>}</span><span>{unavailable ? "No CMS collections detected." : capability.description}</span></span>
              <input type="checkbox" checked={checked && !unavailable} disabled={unavailable} onChange={() => toggleCapability(capability.id)} /><span className="switch" aria-hidden="true" />
            </label>
          })}
        </div>
        {enabled.includes("shopifyCommerce") && <div className="integration-settings">
          <div className="section-label">SHOPIFY STOREFRONT MCP + UCP</div>
          <input value={shopifyDomain} onChange={(event) => setShopifyDomain(event.target.value)} placeholder="store.myshopify.com" aria-label="Shopify store domain" />
          <select value={shopifyMode} onChange={(event) => setShopifyMode(event.target.value as "auto" | "mcp" | "graphql")} aria-label="Shopify connection mode">
            <option value="auto">Auto · MCP with GraphQL fallback</option>
            <option value="mcp">Storefront MCP only</option>
            <option value="graphql">Storefront GraphQL only</option>
          </select>
          {shopifyMode !== "graphql" && <input value={shopifyAgentProfile} onChange={(event) => setShopifyAgentProfile(event.target.value)} placeholder="https://…/ucp-agent.json" aria-label="UCP agent profile URL" />}
          {shopifyMode !== "mcp" && <input value={shopifyToken} onChange={(event) => setShopifyToken(event.target.value)} placeholder="Public Storefront token · fallback only" aria-label="Shopify public Storefront token" />}
          <button type="button" className="integration-test" disabled={!validShopifyDomain || shopifyConnection.state === "testing" || (shopifyMode !== "graphql" && !validShopifyAgentProfile)} onClick={() => void testShopifyConnection()}>{shopifyConnection.state === "testing" ? "Testing…" : "Test Shopify connection"}</button>
          {shopifyConnection.message && <p className={shopifyConnection.state === "error" ? "connection-error" : "connection-result"}>{shopifyConnection.message}</p>}
          <p>{validShopifyDomain && (shopifyMode === "graphql" || validShopifyAgentProfile) ? "Ready · 7 tools, native MCP/UCP discovery, safe hosted checkout." : "Enter a .myshopify.com domain and HTTPS UCP profile URL."}</p>
        </div>}
        {enabled.includes("agenticPayments") && <div className="integration-settings">
          <div className="section-label">CLOUDFLARE AGENTIC PAYMENTS</div>
          <input value={paymentEndpoint} onChange={(event) => setPaymentEndpoint(event.target.value)} placeholder="https://your-worker.workers.dev" aria-label="Cloudflare Agentic Payments endpoint" />
          <p>{validPaymentEndpoint ? "Ready · MPP/x402 credentials stay with the paying agent." : "Enter the HTTPS URL of the AgentReady payments Worker."}</p>
        </div>}
        {enabled.includes("payPerCrawl") && <div className="integration-settings">
          <div className="section-label">CLOUDFLARE PAY PER CRAWL</div>
          <input value={crawlPrice} onChange={(event) => setCrawlPrice(event.target.value)} inputMode="decimal" placeholder="USD per successful crawl" aria-label="USD price per successful crawl" />
          <label className="compact-check"><input type="checkbox" checked={allowAiTraining} onChange={(event) => setAllowAiTraining(event.target.checked)} />Allow paid AI training use</label>
          <p>Requires a Cloudflare-proxied custom domain and Pay Per Crawl beta access.</p>
        </div>}
        {enabled.includes("cloudflareKnowledge") && <div className="integration-settings">
          <div className="section-label">CLOUDFLARE INTELLIGENCE</div>
          <input value={intelligenceEndpoint} onChange={(event) => setIntelligenceEndpoint(event.target.value)} placeholder="https://your-intelligence-worker.workers.dev" aria-label="Cloudflare intelligence endpoint" />
          <label className="compact-check"><input type="checkbox" checked={telemetryEnabled} onChange={(event) => setTelemetryEnabled(event.target.checked)} />Anonymous WebMCP tool analytics</label>
          <p>{validIntelligenceEndpoint ? "Ready · AI Search, provenance, analytics, and Browser Run verification." : "Enter the HTTPS URL of the AgentReady intelligence Worker."}</p>
        </div>}
      </section>

      {disabledByUser && <div className="notice warning">Custom Code is disabled in Site Settings. Enable it before testing.</div>}
      {error && <div className="notice error">{error}</div>}
      <section className="diagnostics" aria-label="Readiness checks">
        <span className={installed ? "pass" : "pending"}>{installed ? "✓" : "1"} Runtime</span>
        <span className={installed && !disabledByUser ? "pass" : "pending"}>{installed && !disabledByUser ? "✓" : "2"} Enabled</span>
        <span className={publishedUrl ? "pass" : "pending"}>{publishedUrl ? "✓" : "3"} Live URL</span>
      </section>
      <footer>
        <div className="publish-summary"><span className={installed ? "ready" : "draft"}>{installed ? "Installed" : "Draft"}</span><span>{toolCount} WebMCP tools</span></div>
        <div className="footer-actions">
          <button className="publish-button" onClick={() => void publish()} disabled={!canPublish || !scan || effectiveEnabled.length === 0 || (deliveryMode !== "direct" && !validMcpPath) || status !== "idle"}>{status === "publishing" ? "Installing…" : installed ? "Update tools" : "Install tools"}<span>→</span></button>
          {installed && <button className="deploy-button" onClick={() => void deploySite()} disabled={!canDeploy || disabledByUser || status !== "idle"}>{status === "deploying" ? "Publishing site…" : "Publish site"}</button>}
          {installed && <button className="remove-button" onClick={() => void removeTools()} disabled={!canPublish || status !== "idle"}>Remove tools</button>}
          {publishedUrl && <a className="live-link" href={publishedUrl} target="_blank" rel="noreferrer">Open live site ↗</a>}
        </div>
      </footer>
    </main>
  )
}
