import { framer, useIsAllowedTo } from "@framer/plugin"
import { useCallback, useEffect, useMemo, useState } from "react"
import { buildWebMcpCustomCode } from "./runtime"
import type { CapabilityId, CmsCollectionSnapshot, RuntimeConfig, SiteScan } from "./types"
import "./App.css"

framer.showUI({ position: "top right", width: 390, height: 620 })

const CAPABILITIES: Array<{ id: CapabilityId; title: string; description: string; risk?: string }> = [
  { id: "siteSearch", title: "Search website", description: "Find matching text, sections, and links on the current page." },
  { id: "cmsSearch", title: "Read CMS content", description: "Search collections and retrieve items by slug." },
  { id: "navigation", title: "Navigate pages", description: "Open same-site pages and reveal matching sections." },
  { id: "formFill", title: "Fill forms", description: "Prepare visible form values for the visitor to review." },
  { id: "formSubmit", title: "Submit forms", description: "Allow agents to perform the final form submission.", risk: "Review carefully" },
]

const DEFAULT_CAPABILITIES: CapabilityId[] = ["siteSearch", "cmsSearch", "navigation", "formFill"]

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
  const [scan, setScan] = useState<SiteScan | null>(null)
  const [enabled, setEnabled] = useState<CapabilityId[]>(DEFAULT_CAPABILITIES)
  const [status, setStatus] = useState<"idle" | "scanning" | "publishing">("idle")
  const [installed, setInstalled] = useState(false)
  const [disabledByUser, setDisabledByUser] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshInstallStatus = useCallback(async () => {
    const customCode = await framer.getCustomCode()
    const bodyEnd = customCode.bodyEnd
    setInstalled(Boolean(bodyEnd.html?.includes("agentready-webmcp")))
    setDisabledByUser(bodyEnd.disabled)
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

  const effectiveEnabled = useMemo(() => enabled.filter((id) => id !== "cmsSearch" || Boolean(scan?.collections.length)), [enabled, scan])
  const toolCount = effectiveEnabled.length + (effectiveEnabled.includes("cmsSearch") ? 1 : 0)

  const toggleCapability = (id: CapabilityId) => {
    setEnabled((current) => current.includes(id) ? current.filter((capability) => capability !== id) : [...current, id])
  }

  const publish = async () => {
    if (!scan) return
    setStatus("publishing")
    setError(null)
    try {
      const config: RuntimeConfig = { version: 1, projectName: scan.projectName, generatedAt: new Date().toISOString(), capabilities: effectiveEnabled, collections: scan.collections }
      await framer.setCustomCode({ html: buildWebMcpCustomCode(config), location: "bodyEnd" })
      await refreshInstallStatus()
      framer.notify(`Published ${toolCount} WebMCP tools`, { variant: "success" })
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish WebMCP tools.")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <main>
      <header className="hero">
        <div className="brand-mark" aria-hidden="true"><span /><span /></div>
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
      </section>

      {disabledByUser && <div className="notice warning">Custom Code is disabled in Site Settings. Enable it before testing.</div>}
      {error && <div className="notice error">{error}</div>}
      <footer>
        <div className="publish-summary"><span className={installed ? "ready" : "draft"}>{installed ? "Installed" : "Draft"}</span><span>{toolCount} WebMCP tools</span></div>
        <button className="publish-button" onClick={() => void publish()} disabled={!canPublish || !scan || effectiveEnabled.length === 0 || status !== "idle"}>{status === "publishing" ? "Publishing…" : installed ? "Update tools" : "Publish tools"}<span>→</span></button>
      </footer>
    </main>
  )
}
