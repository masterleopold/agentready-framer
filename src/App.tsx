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
  { id: "formSubmit", title: "Submit non-payment forms", description: "Allow final submission except checkout, authentication, and sensitive forms.", risk: "Review carefully" },
]

const DEFAULT_CAPABILITIES: CapabilityId[] = ["siteSearch", "cmsSearch", "navigation", "formFill", "conversation", "checkoutAssist"]

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
  const [scan, setScan] = useState<SiteScan | null>(null)
  const [enabled, setEnabled] = useState<CapabilityId[]>(DEFAULT_CAPABILITIES)
  const [status, setStatus] = useState<"idle" | "scanning" | "publishing" | "deploying">("idle")
  const [installed, setInstalled] = useState(false)
  const [disabledByUser, setDisabledByUser] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shopifyDomain, setShopifyDomain] = useState("")
  const [shopifyToken, setShopifyToken] = useState("")
  const [paymentEndpoint, setPaymentEndpoint] = useState("")
  const [crawlPrice, setCrawlPrice] = useState("0.01")
  const [allowAiTraining, setAllowAiTraining] = useState(false)

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

  const validShopifyDomain = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shopifyDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
  const validPaymentEndpoint = /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(paymentEndpoint.trim())
  const validCrawlPrice = /^\d+(?:\.\d{1,6})?$/.test(crawlPrice) && Number(crawlPrice) > 0
  const effectiveEnabled = useMemo(() => enabled.filter((id) => {
    if (id === "cmsSearch") return Boolean(scan?.collections.length)
    if (id === "shopifyCommerce") return validShopifyDomain
    if (id === "agenticPayments") return validPaymentEndpoint
    if (id === "payPerCrawl") return validCrawlPrice
    return true
  }), [enabled, scan, validCrawlPrice, validPaymentEndpoint, validShopifyDomain])
  const toolCount = effectiveEnabled.reduce((count, id) => count + ({
    siteSearch: 1,
    cmsSearch: 2,
    navigation: 1,
    formFill: 7,
    conversation: 2,
    chatSend: 1,
    checkoutAssist: 2,
    shopifyCommerce: 5,
    agenticPayments: 2,
    payPerCrawl: 1,
    formSubmit: 1,
  }[id] ?? 0), 0)

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
        capabilities: effectiveEnabled,
        collections: scan.collections,
        shopify: validShopifyDomain ? { storeDomain, publicAccessToken: shopifyToken.trim() || undefined, apiVersion: "2026-07" } : undefined,
        cloudflarePayments: validPaymentEndpoint ? { endpoint: paymentEndpoint.trim().replace(/\/$/, "") } : undefined,
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
          <div className="section-label">SHOPIFY STOREFRONT</div>
          <input value={shopifyDomain} onChange={(event) => setShopifyDomain(event.target.value)} placeholder="store.myshopify.com" aria-label="Shopify store domain" />
          <input value={shopifyToken} onChange={(event) => setShopifyToken(event.target.value)} placeholder="Public access token (optional)" aria-label="Shopify public Storefront token" />
          <p>{validShopifyDomain ? "Ready · private Admin tokens are never accepted." : "Enter a .myshopify.com domain to enable 5 commerce tools."}</p>
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
          <button className="publish-button" onClick={() => void publish()} disabled={!canPublish || !scan || effectiveEnabled.length === 0 || status !== "idle"}>{status === "publishing" ? "Installing…" : installed ? "Update tools" : "Install tools"}<span>→</span></button>
          {installed && <button className="deploy-button" onClick={() => void deploySite()} disabled={!canDeploy || disabledByUser || status !== "idle"}>{status === "deploying" ? "Publishing site…" : "Publish site"}</button>}
          {publishedUrl && <a className="live-link" href={publishedUrl} target="_blank" rel="noreferrer">Open live site ↗</a>}
        </div>
      </footer>
    </main>
  )
}
