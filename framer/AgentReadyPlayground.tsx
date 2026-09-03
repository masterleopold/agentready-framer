import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

const field: React.CSSProperties = { width: "100%", height: 44, padding: "0 13px", color: "#f7f7f7", background: "#181818", border: "1px solid #2b2b2b", borderRadius: 9, outline: "none", font: "500 13px Inter, sans-serif" }
const label: React.CSSProperties = { display: "grid", gap: 7, color: "#898989", font: "500 10px Inter, sans-serif", letterSpacing: ".04em" }
const button: React.CSSProperties = { minHeight: 42, padding: "0 15px", border: 0, borderRadius: 9, background: "#f5f5f5", color: "#090909", font: "600 12px Inter, sans-serif", cursor: "pointer" }

function Choice({ name, value, children, type = "checkbox", defaultChecked = false }: { name: string; value: string; children: React.ReactNode; type?: "checkbox" | "radio"; defaultChecked?: boolean }) {
  return <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", color: "#ddd", border: "1px solid #2b2b2b", borderRadius: 9, font: "500 12px Inter, sans-serif" }}>
    <input type={type} name={name} value={value} defaultChecked={defaultChecked} style={{ accentColor: "#0099ff" }} />{children}
  </label>
}

export default function AgentReadyPlayground({ checkoutUrl = "", pluginPrice = "$49" }: { checkoutUrl?: string; pluginPrice?: string }) {
  const [step, setStep] = React.useState(1)
  const [messages, setMessages] = React.useState([{ role: "assistant", text: "Tell me what you are trying to accomplish and I’ll help complete the workflow." }])
  const [draft, setDraft] = React.useState("")
  const [cart, setCart] = React.useState(0)
  const [license, setLicense] = React.useState("creator")
  const [purchaseReady, setPurchaseReady] = React.useState(false)

  const send = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    const value = draft.trim()
    setMessages((current) => [...current, { role: "user", text: value }, { role: "assistant", text: "I found a matching Pro workflow. I can prepare the form and cart, then stop for your approval." }])
    setDraft("")
  }

  const purchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLicense(String(new FormData(event.currentTarget).get("license") || "creator"))
    setPurchaseReady(true)
    if (checkoutUrl.startsWith("https://")) window.location.assign(checkoutUrl)
  }

  return <div style={{ width: "100%", padding: 24, color: "#f5f5f5", background: "#0b0b0b", border: "1px solid #242424", borderRadius: 20, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 22 }}>
      <div><div style={{ color: "#0099ff", fontSize: 10, fontWeight: 700, letterSpacing: ".14em" }}>LIVE WEBMCP PLAYGROUND</div><h2 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1, letterSpacing: "-.045em", fontWeight: 500 }}>One page. Real controls. Clear handoffs.</h2></div>
      <div style={{ color: "#69e6b7", fontSize: 10, whiteSpace: "nowrap" }}>● AGENT READY</div>
    </div>

    <form data-agentready-form="plugin-purchase" aria-label="Purchase AgentReady plugin license" onSubmit={purchase} style={{ marginTop: 14, padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, marginBottom: 16 }}><div><div style={{ color: "#0099ff", fontSize: 10, fontWeight: 700, letterSpacing: ".12em" }}>BUY AGENTREADY WITH WEBMCP</div><h3 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 500 }}>Purchase the plugin using its own tools.</h3><p style={{ margin: 0, color: "#777", fontSize: 11 }}>The agent prepares the order. You review and complete secure checkout.</p></div><strong style={{ fontSize: 22, whiteSpace: "nowrap" }}>{pluginPrice} <small style={{ color: "#777", fontSize: 10 }}>ONE-TIME</small></strong></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        <label style={label}>FULL NAME<input required style={field} name="buyerName" autoComplete="name" placeholder="Your name" /></label>
        <label style={label}>EMAIL<input required style={field} type="email" name="buyerEmail" autoComplete="email" placeholder="you@company.com" /></label>
        <label style={label}>COMPANY<input style={field} name="organization" autoComplete="organization" placeholder="Optional" /></label>
        <label style={label}>COUNTRY<select required style={field} name="country" autoComplete="country"><option value="">Choose country</option><option value="JP">Japan</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="DE">Germany</option><option value="FR">France</option><option value="SG">Singapore</option></select></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginTop: 12 }}>
        <Choice type="radio" name="license" value="creator" defaultChecked>Creator · 1 workspace</Choice>
        <Choice type="radio" name="license" value="studio">Studio · 5 workspaces</Choice>
        <Choice type="radio" name="license" value="agency">Agency · unlimited sites</Choice>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, color: "#999", fontSize: 11 }}><input required type="checkbox" name="acceptTerms" value="accepted" style={{ accentColor: "#0099ff" }} />I agree to the license terms and refund policy.</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}><button type="submit" style={button}>Continue to secure checkout →</button><span aria-live="polite" style={{ color: purchaseReady ? "#69e6b7" : "#777", fontSize: 11 }}>{purchaseReady ? `✓ ${license} order prepared · Complete payment in secure checkout` : "Card and wallet credentials are never exposed to WebMCP."}</span></div>
    </form>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
      <form data-agentready-form="application" aria-label="Multi-step application" style={{ padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><strong style={{ fontSize: 14 }}>Application</strong><span aria-current="step" style={{ color: "#777", fontSize: 10 }}>Step {step} of 3</span></div>
        {step === 1 && <div style={{ display: "grid", gap: 12 }}>
          <label style={label}>FULL NAME<input style={field} name="fullName" autoComplete="name" placeholder="Your name" /></label>
          <label style={label}>STREET<input style={field} name="street" autoComplete="shipping address-line1" placeholder="1-1 Marunouchi" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={label}>CITY<input style={field} name="city" autoComplete="shipping address-level2" /></label><label style={label}>POSTAL CODE<input style={field} name="postalCode" autoComplete="shipping postal-code" /></label></div>
        </div>}
        {step === 2 && <div style={{ display: "grid", gap: 12 }}>
          <div style={label}>PLAN<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><Choice type="radio" name="plan" value="starter">Starter</Choice><Choice type="radio" name="plan" value="pro">Pro</Choice></div></div>
          <div style={label}>INTERESTS<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><Choice name="interests" value="design">Design</Choice><Choice name="interests" value="commerce">Commerce</Choice></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={label}>DATE<input style={field} type="date" name="meetingDate" /></label><label style={label}>TIME<input style={field} type="time" name="meetingTime" /></label></div>
          <label style={label}>REFERENCE FILE<input style={{ ...field, paddingTop: 10 }} type="file" name="referenceFile" accept=".pdf,.png,.jpg" /></label>
        </div>}
        {step === 3 && <div style={{ padding: 16, color: "#aaa", background: "#181818", borderRadius: 10, fontSize: 12, lineHeight: 1.55 }}>The agent prepared your details. Review every value before the final submission. Payment and authentication controls always remain yours.</div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}><button type="button" style={{ ...button, background: "#232323", color: "#ddd", visibility: step === 1 ? "hidden" : "visible" }} onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</button>{step < 3 ? <button type="button" style={button} onClick={() => setStep((value) => Math.min(3, value + 1))}>Next</button> : <button type="submit" style={button}>Submit application</button>}</div>
      </form>

      <section aria-label="Support chatbot" style={{ padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111", display: "flex", flexDirection: "column", minHeight: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><strong style={{ fontSize: 14 }}>Conversation</strong><span style={{ color: "#69e6b7", fontSize: 10 }}>● ONLINE</span></div>
        <div role="log" aria-live="polite" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, overflow: "auto" }}>
          {messages.map((message, index) => <div key={index} data-message-author-role={message.role} style={{ alignSelf: message.role === "user" ? "end" : "start", maxWidth: "84%", padding: "11px 12px", color: message.role === "user" ? "#071018" : "#ddd", background: message.role === "user" ? "#63c7ff" : "#1c1c1c", borderRadius: 11, fontSize: 12, lineHeight: 1.45 }}>{message.text}</div>)}
        </div>
        <form onSubmit={send} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 14 }}><input style={field} name="message" aria-label="Chat message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask AgentReady…" /><button type="submit" aria-label="Send" style={button}>Send</button></form>
      </section>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 14 }}>
      <section aria-label="Shopify cart demo" style={{ padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111" }}><div style={{ color: "#77d89c", fontSize: 10, fontWeight: 700, letterSpacing: ".12em" }}>SHOPIFY STOREFRONT</div><h3 style={{ margin: "9px 0 5px", fontSize: 18, fontWeight: 500 }}>Agent Kit — Pro</h3><p style={{ margin: "0 0 14px", color: "#777", fontSize: 11 }}>Variant selection, cart state, discounts, and buyer context via Storefront API.</p><button type="button" style={button} onClick={() => setCart((value) => value + 1)}>Add to cart · ${"29"}</button><span style={{ marginLeft: 10, color: "#888", fontSize: 11 }}>{cart} in cart</span></section>
      <section aria-label="Cloudflare payment demo" style={{ padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111" }}><div style={{ color: "#f5a348", fontSize: 10, fontWeight: 700, letterSpacing: ".12em" }}>CLOUDFLARE · HTTP 402</div><h3 style={{ margin: "9px 0 5px", fontSize: 18, fontWeight: 500 }}>Agentic offer · $0.01</h3><p style={{ margin: "0 0 14px", color: "#777", fontSize: 11 }}>MPP challenge, scoped agent approval, and a protocol receipt without exposing wallet keys to Framer.</p><button type="button" style={{ ...button, background: "#f5a348" }}>Request payment challenge</button></section>
      <section aria-label="Paid structured content demo" style={{ padding: 18, border: "1px solid #292929", borderRadius: 14, background: "#111" }}><div style={{ color: "#63c7ff", fontSize: 10, fontWeight: 700, letterSpacing: ".12em" }}>PAY PER CRAWL · JSON</div><h3 style={{ margin: "9px 0 5px", fontSize: 18, fontWeight: 500 }}>Licensed content feed</h3><p style={{ margin: "0 0 14px", color: "#777", fontSize: 11 }}>Canonical source, headings, readable content, links, retrieval time, charged header, and SHA-256 digest.</p><code style={{ display: "block", padding: "10px 11px", color: "#9bdcff", background: "#080d12", borderRadius: 8, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" }}>/agentready/content.json</code></section>
    </div>
  </div>
}

addPropertyControls(AgentReadyPlayground, {
  checkoutUrl: { type: ControlType.String, title: "Checkout URL", placeholder: "https://checkout.example.com/agentready" },
  pluginPrice: { type: ControlType.String, title: "Plugin Price", defaultValue: "$49" },
})
