import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// Visual language mirrors framer.com: black page, #111 section surfaces, #171717 cards,
// #1F1F1F controls, 7% white hairlines, 8–20px radii, Inter 14px/500 UI text.
const color = {
  surface: "#0A0A0A",
  card: "#141414",
  control: "#1F1F1F",
  controlHover: "#242424",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.6)",
  textTertiary: "rgba(255,255,255,0.4)",
  blue: "#0099FF",
  green: "#00DD66",
  orange: "#FD7702",
  purple: "#8A58FF",
}

const sans = "Inter, 'Inter Placeholder', sans-serif"
const display = "Satoshi, Inter, 'Inter Placeholder', sans-serif"

const field: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", color: color.text, background: color.control, border: `1px solid ${color.border}`, borderRadius: 10, outline: "none", font: `500 14px ${sans}`, letterSpacing: "-0.01em", boxSizing: "border-box", colorScheme: "dark" }
const chevron = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")"
const select: React.CSSProperties = { ...field, appearance: "none", WebkitAppearance: "none", paddingRight: 36, backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer" }
const check: React.CSSProperties = { width: 16, height: 16, margin: 0, accentColor: color.blue, colorScheme: "dark", flex: "none" }
const label: React.CSSProperties = { display: "grid", gap: 6, color: color.textSecondary, font: `500 12px ${sans}`, letterSpacing: "-0.01em" }
const button: React.CSSProperties = { height: 36, padding: "0 14px", border: 0, borderRadius: 8, background: color.text, color: "#000000", font: `600 13px ${sans}`, letterSpacing: "-0.01em", cursor: "pointer", whiteSpace: "nowrap" }
const secondaryButton: React.CSSProperties = { ...button, background: "rgba(255,255,255,0.1)", color: color.text }
const card: React.CSSProperties = { padding: 20, border: `1px solid ${color.border}`, borderRadius: 14, background: color.card, boxSizing: "border-box", minWidth: 0 }
const eyebrow = (tint: string): React.CSSProperties => ({ color: tint, font: `500 12px ${sans}`, letterSpacing: "-0.01em", lineHeight: 1 })
const cardTitle: React.CSSProperties = { margin: "12px 0 10px", color: color.text, font: `500 18px ${display}`, letterSpacing: "-0.02em", lineHeight: 1.2 }
const body: React.CSSProperties = { margin: 0, color: color.textSecondary, font: `400 14px ${sans}`, letterSpacing: "-0.1px", lineHeight: 1.5 }
const price: React.CSSProperties = { marginLeft: "auto", whiteSpace: "nowrap", color: color.textSecondary, fontVariantNumeric: "tabular-nums" }
const status: React.CSSProperties = { margin: "10px 0 0", color: color.textTertiary, font: `400 12px ${sans}`, lineHeight: 1.4 }

function Choice({ name, value, children, type = "checkbox", defaultChecked = false }: { name: string; value: string; children: React.ReactNode; type?: "checkbox" | "radio"; defaultChecked?: boolean }) {
  return <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", color: color.text, background: color.control, border: `1px solid ${color.border}`, borderRadius: 10, font: `500 13px ${sans}`, letterSpacing: "-0.01em", cursor: "pointer" }}>
    <input type={type} name={name} value={value} defaultChecked={defaultChecked} style={check} />{children}
  </label>
}

const marks: Record<"shopify" | "cloudflare" | "framer", { label: string; tint: string; d: string }> = {
  shopify: { label: "Shopify", tint: "#96BF48", d: "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" },
  cloudflare: { label: "Cloudflare", tint: "#F38020", d: "M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" },
  framer: { label: "Framer", tint: "#FFFFFF", d: "M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" },
}

// Partner badge: brand mark in its own color, brand name, then the feature in secondary text.
function Partner({ brand, feature }: { brand: keyof typeof marks; feature: string }) {
  const mark = marks[brand]
  return <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, background: color.control }} aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill={mark.tint} role="img" aria-label={mark.label}><path d={mark.d} /></svg>
    </span>
    <span style={{ color: color.text, font: `500 12px ${sans}`, letterSpacing: "-0.01em", lineHeight: 1 }}>{mark.label}</span>
    <span style={{ color: color.textTertiary, font: `500 12px ${sans}`, letterSpacing: "-0.01em", lineHeight: 1 }}>· {feature}</span>
  </div>
}

type Message = { role: "assistant" | "user"; text: string }
type Panel = "purchase" | "workflow" | "integrations"

function useNarrow(ref: React.RefObject<HTMLDivElement | null>) {
  const [narrow, setNarrow] = React.useState(false)
  // The Framer canvas renders statically and reports a zero-width box on the first measurement,
  // which would collapse the playground into phone tabs. Only measure in a live browser.
  const isStatic = useIsStaticRenderer()
  React.useEffect(() => {
    const el = ref.current
    if (isStatic || !el || typeof ResizeObserver === "undefined") return
    const check = () => { const width = el.getBoundingClientRect().width; if (width > 0) setNarrow(width < 720) }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, isStatic])
  return narrow
}

interface AgentReadyPlaygroundProps {
  checkoutUrl?: string
  creatorPrice?: string
  studioPrice?: string
  agencyPrice?: string
  creatorVariantId?: string
  studioVariantId?: string
  agencyVariantId?: string
  paymentEndpoint?: string
  intelligenceEndpoint?: string
  style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AgentReadyPlayground({ checkoutUrl = "", creatorPrice = "$49", studioPrice = "$149", agencyPrice = "$399", creatorVariantId = "", studioVariantId = "", agencyVariantId = "", paymentEndpoint = "", intelligenceEndpoint = "", style }: AgentReadyPlaygroundProps) {
  const [step, setStep] = React.useState(1)
  const [messages, setMessages] = React.useState<Message[]>([
    { role: "assistant", text: "Tell me what you are trying to accomplish and I’ll help complete the workflow." },
    { role: "user", text: "Prepare a Studio license and fill the application with my company details." },
    { role: "assistant", text: "Done. I selected Studio, filled the application form, and left checkout and submission for you to confirm." },
  ])
  const [draft, setDraft] = React.useState("")
  const [cart, setCart] = React.useState(0)
  const [license, setLicense] = React.useState("creator")
  const [country, setCountry] = React.useState("")
  const [purchaseReady, setPurchaseReady] = React.useState(false)
  const [applicationStatus, setApplicationStatus] = React.useState("")
  const [paymentStatus, setPaymentStatus] = React.useState("Request a machine-readable payment challenge.")
  const [showJson, setShowJson] = React.useState(false)
  const [knowledgeQuery, setKnowledgeQuery] = React.useState("How are payments kept safe?")
  const [knowledgeStatus, setKnowledgeStatus] = React.useState("Hybrid search · cited sources · SHA-256 provenance")
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const narrow = useNarrow(rootRef)
  const [panel, setPanel] = React.useState<Panel>("purchase")
  const show = (name: Panel) => !narrow || panel === name
  const selectedPrice = license === "studio" ? studioPrice : license === "agency" ? agencyPrice : creatorPrice

  const send = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    const value = draft.trim()
    setMessages((current: Message[]) => [...current, { role: "user", text: value }, { role: "assistant", text: "I found a matching Pro workflow. I can prepare the form and cart, then stop for your approval." }])
    setDraft("")
  }

  const purchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const selectedLicense = String(new FormData(event.currentTarget).get("license") || "creator")
    setLicense(selectedLicense)
    setPurchaseReady(true)
    if (checkoutUrl.startsWith("https://") && typeof window !== "undefined") {
      const productUrl = new URL(checkoutUrl)
      const variantId = selectedLicense === "studio" ? studioVariantId : selectedLicense === "agency" ? agencyVariantId : creatorVariantId
      const target = /^\d+$/.test(variantId) ? new URL(`/cart/${variantId}:1`, productUrl.origin) : productUrl
      if (!variantId) target.searchParams.set("license", selectedLicense)
      window.location.assign(target.href)
    }
  }

  const requestPayment = async () => {
    if (!paymentEndpoint.startsWith("https://")) {
      setPaymentStatus("Connect the deployed Cloudflare MPP Worker to activate this challenge.")
      return
    }
    setPaymentStatus("Requesting HTTP 402 challenge…")
    try {
      const response = await fetch(paymentEndpoint.replace(/\/$/, "") + "/v1/offers/agentready-" + license + "/purchase", { headers: { Accept: "application/json" } })
      setPaymentStatus(response.status === 402 ? "✓ HTTP 402 challenge received · payment-capable agent may continue" : response.ok ? "✓ Payment receipt verified" : "Payment endpoint returned HTTP " + response.status)
    } catch {
      setPaymentStatus("Payment Worker could not be reached.")
    }
  }

  const searchKnowledge = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!intelligenceEndpoint.startsWith("https://")) {
      setKnowledgeStatus("Connect the deployed Cloudflare Intelligence Worker to query AI Search.")
      return
    }
    setKnowledgeStatus("Searching Cloudflare AI Search…")
    try {
      const response = await fetch(intelligenceEndpoint.replace(/\/$/, "") + "/v1/knowledge/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: knowledgeQuery, limit: 3 }) })
      const result = await response.json() as { count?: number; error?: string }
      setKnowledgeStatus(response.ok ? `✓ ${result.count ?? 0} cited source chunks · anonymous tool metric recorded` : result.error ?? `Search returned HTTP ${response.status}`)
    } catch {
      setKnowledgeStatus("Cloudflare Intelligence Worker could not be reached.")
    }
  }

  const canonical = typeof window !== "undefined" ? window.location.href : "https://agentready.framer.website/"

  return <div ref={rootRef} style={{ ...style, position: "relative", width: "100%", padding: narrow ? 16 : 24, color: color.text, background: color.surface, border: `1px solid ${color.border}`, borderRadius: 20, fontFamily: sans, fontFeatureSettings: '"cv11", "ss03", "cv01", "cv09", "cv05"', boxSizing: "border-box", display: "grid", gap: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", flexWrap: "wrap", padding: "4px 4px 12px" }}>
      <div>
        <div style={eyebrow(color.textTertiary)}>Live WebMCP playground</div>
        <h2 style={{ margin: "10px 0 0", color: color.text, font: `500 28px ${display}`, lineHeight: 1.05, letterSpacing: "-0.04em" }}>One page. Real controls. Clear handoffs.</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 12px", background: "rgba(255,255,255,0.1)", borderRadius: 8, color: color.text, font: `500 12px ${sans}`, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color.green }} />Agent ready
      </div>
    </div>
    {narrow && <div role="tablist" aria-label="Playground sections" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: 4, background: color.card, borderRadius: 10 }}>
      {([["purchase", "Purchase"], ["workflow", "Forms & chat"], ["integrations", "Integrations"]] as [Panel, string][]).map(([key, labelText]) => <button key={key} role="tab" type="button" aria-selected={panel === key} onClick={() => setPanel(key)} style={{ height: 34, border: 0, borderRadius: 8, background: panel === key ? color.control : "transparent", color: panel === key ? color.text : color.textSecondary, font: `500 13px ${sans}`, letterSpacing: "-0.01em", cursor: "pointer" }}>{labelText}</button>)}
    </div>}

    {show("purchase") && <form data-agentready-form="plugin-purchase" aria-label="Purchase AgentReady plugin license" onSubmit={purchase} onChange={(event) => { const target = event.target as HTMLInputElement; if (target.name === "license") setLicense(target.value) }} style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <Partner brand="shopify" feature="Example purchase · hosted checkout" />
          <h3 style={{ ...cardTitle, fontSize: 22 }}>Purchase the plugin using its own tools.</h3>
          <p style={body}>The agent prepares the order and you review it. This is a demo: nothing is charged and no card is requested.</p>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
          <strong style={{ color: color.text, font: `500 26px ${display}`, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{selectedPrice}</strong>
          <small style={{ color: color.textTertiary, font: `500 12px ${sans}` }}>example price</small>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <label style={label}>Full name<input required style={field} name="buyerName" autoComplete="name" placeholder="Your name" /></label>
        <label style={label}>Email<input required style={field} type="email" name="buyerEmail" autoComplete="email" placeholder="you@company.com" /></label>
        <label style={label}>Company<input style={field} name="organization" autoComplete="organization" placeholder="Optional" /></label>
        <label style={label}>Country<select required style={{ ...select, color: country ? color.text : color.textTertiary }} name="country" autoComplete="country" value={country} onChange={(event) => setCountry(event.target.value)}><option value="">Choose country</option><option value="JP">Japan</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="DE">Germany</option><option value="FR">France</option><option value="SG">Singapore</option></select></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginTop: 12 }}>
        <Choice type="radio" name="license" value="creator" defaultChecked><span>Creator · 1 workspace</span><span style={price}>{creatorPrice}</span></Choice>
        <Choice type="radio" name="license" value="studio"><span>Studio · 5 workspaces</span><span style={price}>{studioPrice}</span></Choice>
        <Choice type="radio" name="license" value="agency"><span>Agency · unlimited sites</span><span style={price}>{agencyPrice}</span></Choice>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, color: color.textSecondary, font: `400 13px ${sans}`, letterSpacing: "-0.01em" }}><input required type="checkbox" name="acceptTerms" value="accepted" style={check} />I will review the license and refund terms before final payment.</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}><button type="submit" style={button}>{checkoutUrl ? "Continue to secure checkout" : "Prepare checkout"}</button><span aria-live="polite" style={{ color: purchaseReady ? color.green : color.textTertiary, font: `400 12px ${sans}` }}>{purchaseReady ? "✓ " + license + " order prepared · Final payment remains human-controlled" : "Prices shown in USD. Shopify checkout charges the equivalent in JPY. Card and wallet details are never requested here."}</span></div>
    </form>}

    {show("workflow") && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
      <form data-agentready-form="application" aria-label="Multi-step application" onSubmit={(event) => { event.preventDefault(); setApplicationStatus("✓ Application received in this local demo") }} style={{ ...card, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><strong style={{ color: color.text, font: `500 16px ${display}`, letterSpacing: "-0.02em" }}>Application</strong><span aria-current="step" style={{ color: color.textTertiary, font: `500 12px ${sans}` }}>Step {step} of 3</span></div>
        <div aria-hidden={step !== 1} style={{ display: step === 1 ? "grid" : "none", gap: 12 }}>
          <label style={label}>Full name<input style={field} name="fullName" autoComplete="name" placeholder="Your name" /></label>
          <label style={label}>Street<input style={field} name="street" autoComplete="shipping address-line1" placeholder="1-1 Marunouchi" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={label}>City<input style={field} name="city" autoComplete="shipping address-level2" /></label><label style={label}>Postal code<input style={field} name="postalCode" autoComplete="shipping postal-code" /></label></div>
        </div>
        <div aria-hidden={step !== 2} style={{ display: step === 2 ? "grid" : "none", gap: 12 }}>
          <div style={label}>Plan<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><Choice type="radio" name="plan" value="starter">Starter</Choice><Choice type="radio" name="plan" value="pro">Pro</Choice></div></div>
          <div style={label}>Interests<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><Choice name="interests" value="design">Design</Choice><Choice name="interests" value="commerce">Commerce</Choice></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={label}>Date<input style={field} type="date" name="meetingDate" /></label><label style={label}>Time<input style={field} type="time" name="meetingTime" /></label></div>
          <label style={label}>Reference files<input style={{ ...field, paddingTop: 9 }} type="file" name="referenceFiles" accept=".pdf,.png,.jpg" multiple /></label>
        </div>
        <div aria-hidden={step !== 3} style={{ display: step === 3 ? "block" : "none", padding: 16, color: color.textSecondary, background: color.control, borderRadius: 10, font: `400 13px ${sans}`, lineHeight: 1.5 }}>The agent prepared your details. Review every value before the final submission. Payment and authentication controls always remain yours.</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 16 }}><button type="button" style={{ ...secondaryButton, visibility: step === 1 ? "hidden" : "visible" }} onClick={() => setStep((value: number) => Math.max(1, value - 1))}>Back</button>{step < 3 ? <button type="button" style={button} onClick={() => setStep((value: number) => Math.min(3, value + 1))}>Next</button> : <button type="submit" style={button}>Submit application</button>}</div>
        {applicationStatus && <p role="status" style={{ ...status, color: color.green }}>{applicationStatus}</p>}
      </form>

      <section aria-label="Support chatbot" style={{ ...card, display: "flex", flexDirection: "column", minHeight: 360 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><strong style={{ color: color.text, font: `500 16px ${display}`, letterSpacing: "-0.02em" }}>Conversation</strong><span style={{ display: "flex", alignItems: "center", gap: 6, color: color.textSecondary, font: `500 12px ${sans}` }}><span style={{ width: 6, height: 6, borderRadius: 999, background: color.green }} />Online</span></div>
        <div role="log" aria-live="polite" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
          {messages.map((message: Message, index: number) => <div key={index} data-message-author-role={message.role} style={{ alignSelf: message.role === "user" ? "end" : "start", maxWidth: "84%", padding: "10px 12px", color: message.role === "user" ? "#FFFFFF" : color.textSecondary, background: message.role === "user" ? color.blue : color.control, borderRadius: 12, font: `400 13px ${sans}`, letterSpacing: "-0.01em", lineHeight: 1.45 }}>{message.text}</div>)}
        </div>
        <form onSubmit={send} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 14 }}><input style={field} name="message" aria-label="Chat message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask AgentReady…" /><button type="submit" aria-label="Send" style={{ ...secondaryButton, height: 40 }}>Send</button></form>
      </section>
    </div>}

    {show("integrations") && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
      <section aria-label="Shopify cart demo" style={card}><Partner brand="shopify" feature="Storefront MCP + UCP" /><h3 style={cardTitle}>Agent Kit — Pro</h3><p style={{ ...body, marginBottom: 16 }}>Localized catalog discovery, variant selection, merchant policies, cart state, and safe hosted checkout.</p><div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><button type="button" style={button} onClick={() => setCart((value: number) => value + 1)}>Add to cart · $29</button><span style={{ color: color.textTertiary, font: `400 12px ${sans}`, fontVariantNumeric: "tabular-nums" }}>{cart} in cart</span></div><p style={status}>Demo counter. The seven Shopify cart tools on this page are connected to a live development store.</p></section>
      <section aria-label="Cloudflare payment demo" style={card}><Partner brand="cloudflare" feature="Agentic Payments · HTTP 402" /><h3 style={cardTitle}>Agentic plugin purchase</h3><p style={{ ...body, marginBottom: 16 }}>MPP challenge, scoped agent approval, and a protocol receipt without exposing wallet keys to Framer.</p><button type="button" style={secondaryButton} onClick={() => void requestPayment()}>Request payment challenge</button><p aria-live="polite" style={status}>{paymentStatus}</p></section>
      <section aria-label="Paid structured content demo" style={card}><Partner brand="cloudflare" feature="Pay Per Crawl · JSON" /><h3 style={cardTitle}>Licensed content feed</h3><p style={{ ...body, marginBottom: 16 }}>Canonical source, JSON-LD, permitted purposes, license, retrieval time, charged header, and SHA-256 digest.</p><button type="button" style={secondaryButton} onClick={() => setShowJson((value: boolean) => !value)}>{showJson ? "Hide JSON contract" : "Preview JSON contract"}</button>{showJson && <pre style={{ margin: "12px 0 0", padding: 12, color: color.textSecondary, background: color.control, border: `1px solid ${color.border}`, borderRadius: 10, font: `400 11px ui-monospace, SFMono-Regular, Menlo, monospace`, lineHeight: 1.5, overflow: "auto" }}>{JSON.stringify({ schema: "/agentready/schema.json", source: { canonical }, license: { contentUse: "reference", permittedPurposes: ["search", "ai-input"] }, provenance: { contentDigest: "sha-256" } }, null, 2)}</pre>}</section>
      <section aria-label="Cloudflare intelligence demo" style={card}><Partner brand="cloudflare" feature="AI Search · Browser Run" /><h3 style={cardTitle}>Grounded site knowledge</h3><p style={{ ...body, marginBottom: 14 }}>Rendered Framer pages become cited AI Search knowledge. Browser Run verifies every release; Analytics Engine records privacy-safe tool health.</p><form onSubmit={searchKnowledge} style={{ display: "grid", gap: 8 }}><input style={field} name="knowledgeQuery" aria-label="Knowledge search query" value={knowledgeQuery} onChange={(event) => setKnowledgeQuery(event.target.value)} /><button type="submit" style={{ ...secondaryButton, height: 40 }}>Search</button></form><p aria-live="polite" style={status}>{knowledgeStatus}</p></section>
    </div>}
  </div>
}

addPropertyControls(AgentReadyPlayground, {
  checkoutUrl: { type: ControlType.String, title: "Checkout URL", placeholder: "https://checkout.example.com/agentready" },
  creatorPrice: { type: ControlType.String, title: "Creator Price", defaultValue: "$49" },
  studioPrice: { type: ControlType.String, title: "Studio Price", defaultValue: "$149" },
  agencyPrice: { type: ControlType.String, title: "Agency Price", defaultValue: "$399" },
  creatorVariantId: { type: ControlType.String, title: "Creator Variant ID" },
  studioVariantId: { type: ControlType.String, title: "Studio Variant ID" },
  agencyVariantId: { type: ControlType.String, title: "Agency Variant ID" },
  paymentEndpoint: { type: ControlType.String, title: "MPP Worker", placeholder: "https://agentready-payments.workers.dev" },
  intelligenceEndpoint: { type: ControlType.String, title: "AI Search Worker", placeholder: "https://agentready-intelligence.workers.dev" },
})

