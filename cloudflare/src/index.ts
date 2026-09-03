import { DurableObject } from "cloudflare:workers"

interface Env {
  SESSIONS: DurableObjectNamespace<AgentReadySession>
  UPLOADS: R2Bucket
  TURNSTILE_SECRET: string
  ALLOWED_ORIGINS: string
  MAX_UPLOAD_BYTES?: string
}

interface SessionEvent {
  id: string
  at: string
  type: "form.prepared" | "step.changed" | "chat.sent" | "chat.received" | "checkout.prepared" | "upload.ready" | "human.verified"
  summary: string
}

interface SessionSnapshot {
  verifiedUntil?: string
  events: SessionEvent[]
}

const json = (body: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", ...headers },
})

const sensitive = /password|passcode|pin|otp|cvv|cvc|card.?number|iban|routing|bank.?account|ssn|secret|token/i

export class AgentReadySession extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const snapshot = await this.ctx.storage.get<SessionSnapshot>("snapshot") ?? { events: [] }
    if (request.method === "GET") return json(snapshot)
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)

    const payload = await request.json<SessionEvent>()
    if (!payload.type || !payload.summary || sensitive.test(payload.summary)) {
      return json({ error: "Invalid or potentially sensitive event" }, 400)
    }
    const event: SessionEvent = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      type: payload.type,
      summary: payload.summary.slice(0, 500),
    }
    snapshot.events = [...snapshot.events.slice(-99), event]
    if (event.type === "human.verified") snapshot.verifiedUntil = new Date(Date.now() + 5 * 60_000).toISOString()
    await this.ctx.storage.put("snapshot", snapshot)
    return json({ accepted: true, event, verifiedUntil: snapshot.verifiedUntil }, 201)
  }
}

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("origin") ?? ""
  const allowed = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean)
  return allowed.includes(origin) ? origin : ""
}

function cors(origin: string): HeadersInit {
  return origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-agentready-session",
    "vary": "Origin",
  } : {}
}

function sessionStub(env: Env, sessionId: string) {
  return env.SESSIONS.get(env.SESSIONS.idFromName(sessionId))
}

async function verifyTurnstile(request: Request, env: Env, sessionId: string, origin: string) {
  const { token } = await request.json<{ token?: string }>()
  if (!token) return json({ verified: false, error: "Turnstile token is required" }, 400, cors(origin))
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get("CF-Connecting-IP"), idempotency_key: crypto.randomUUID() }),
  }).then((response) => response.json<{ success: boolean; hostname?: string; action?: string; "error-codes"?: string[] }>())
  if (!result.success) return json({ verified: false, errors: result["error-codes"] ?? [] }, 403, cors(origin))
  await sessionStub(env, sessionId).fetch("https://session/events", { method: "POST", body: JSON.stringify({ type: "human.verified", summary: `Verified for ${result.hostname ?? "configured host"}` }) })
  return json({ verified: true, expiresInSeconds: 300 }, 200, cors(origin))
}

async function upload(request: Request, env: Env, sessionId: string, origin: string) {
  const state = await sessionStub(env, sessionId).fetch("https://session").then((response) => response.json<SessionSnapshot>())
  if (!state.verifiedUntil || Date.parse(state.verifiedUntil) < Date.now()) return json({ error: "Fresh human verification required" }, 403, cors(origin))
  const maxBytes = Number(env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024)
  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > maxBytes) return json({ error: "Upload exceeds configured limit" }, 413, cors(origin))
  const contentType = request.headers.get("content-type") ?? "application/octet-stream"
  const body = await request.arrayBuffer()
  if (body.byteLength > maxBytes) return json({ error: "Upload exceeds configured limit" }, 413, cors(origin))
  const key = `${sessionId}/${crypto.randomUUID()}`
  await env.UPLOADS.put(key, body, { httpMetadata: { contentType }, customMetadata: { source: "agentready-human-handoff" } })
  await sessionStub(env, sessionId).fetch("https://session/events", { method: "POST", body: JSON.stringify({ type: "upload.ready", summary: "A human-selected file was stored for this session" }) })
  return json({ uploaded: true, objectKey: key, contentType }, 201, cors(origin))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env)
    if (request.method === "OPTIONS") return new Response(null, { status: origin ? 204 : 403, headers: cors(origin) })
    if (!origin) return json({ error: "Origin not allowed" }, 403)

    const url = new URL(request.url)
    const match = url.pathname.match(/^\/v1\/sessions\/([a-zA-Z0-9_-]{8,128})(?:\/(events|verify|upload))?$/)
    if (!match) return json({ error: "Not found" }, 404, cors(origin))
    const [, sessionId, action] = match
    if (action === "verify" && request.method === "POST") return verifyTurnstile(request, env, sessionId, origin)
    if (action === "upload" && request.method === "POST") return upload(request, env, sessionId, origin)
    if ((!action && request.method === "GET") || (action === "events" && request.method === "POST")) {
      const path = action === "events" ? "https://session/events" : "https://session"
      const response = await sessionStub(env, sessionId).fetch(path, { method: request.method, body: request.method === "POST" ? request.body : undefined })
      return new Response(response.body, { status: response.status, headers: { ...cors(origin), "content-type": "application/json; charset=utf-8" } })
    }
    return json({ error: "Method not allowed" }, 405, cors(origin))
  },
} satisfies ExportedHandler<Env>
