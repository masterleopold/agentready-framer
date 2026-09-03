import { env } from "cloudflare:workers"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Mppx, tempo } from "mppx/hono"

interface PaymentEnv {
  ALLOWED_ORIGIN: string
  MPP_SECRET_KEY: string
  MPP_RECIPIENT: `0x${string}`
  MPP_CURRENCY: string
  MPP_TESTNET: string
  CREATOR_AMOUNT: string
  STUDIO_AMOUNT: string
  AGENCY_AMOUNT: string
}

const workerEnv = env as PaymentEnv
const app = new Hono()
const payments = Mppx.create({
  methods: [tempo.charge({ testnet: workerEnv.MPP_TESTNET !== "false" })],
  secretKey: workerEnv.MPP_SECRET_KEY,
})

app.use("*", cors({
  origin: workerEnv.ALLOWED_ORIGIN,
  allowMethods: ["GET", "OPTIONS"],
  allowHeaders: ["Accept", "Authorization", "Payment-Signature", "Payment-Required"],
  exposeHeaders: ["WWW-Authenticate", "Payment-Required", "Payment-Response", "Payment-Receipt"],
}))
app.use("/v1/*", async (context, next) => {
  await next()
  context.header("Cache-Control", "no-store")
  context.header("Vary", "Origin, Authorization")
})

const offers = [
  { id: "agentready-creator", title: "AgentReady Creator", description: "AgentReady for one Framer workspace.", amount: workerEnv.CREATOR_AMOUNT },
  { id: "agentready-studio", title: "AgentReady Studio", description: "AgentReady for up to five Framer workspaces.", amount: workerEnv.STUDIO_AMOUNT },
  { id: "agentready-agency", title: "AgentReady Agency", description: "AgentReady for unlimited client sites.", amount: workerEnv.AGENCY_AMOUNT },
] as const

app.get("/v1/offers", (context) => context.json({
  protocol: "MPP",
  paymentFlow: ["request", "402 challenge", "pay", "retry with Authorization: Payment", "receipt"],
  offers: offers.map((offer) => ({ ...offer, paymentType: "one-time", method: "Tempo stablecoin", network: workerEnv.MPP_TESTNET !== "false" ? "Tempo testnet" : "Tempo mainnet", currency: workerEnv.MPP_CURRENCY })),
}))

app.get("/v1/status", (context) => context.json({
  ready: Boolean(workerEnv.MPP_SECRET_KEY && workerEnv.MPP_RECIPIENT && workerEnv.MPP_CURRENCY),
  protocol: "MPP",
  challengeHeader: "WWW-Authenticate: Payment",
  credentialHeader: "Authorization: Payment",
  receiptHeader: "Payment-Receipt",
  paymentTypes: ["one-time"],
  method: "Tempo stablecoin",
  network: workerEnv.MPP_TESTNET !== "false" ? "testnet" : "mainnet",
}))

for (const offer of offers) {
  app.get(
    "/v1/offers/" + offer.id + "/purchase",
    payments.charge({
      amount: offer.amount,
      currency: workerEnv.MPP_CURRENCY,
      description: offer.title,
      recipient: workerEnv.MPP_RECIPIENT,
    }),
    async (context) => {
      const credential = context.req.header("Authorization")
      const orderId = credential
        ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(credential)))).slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("")
        : crypto.randomUUID()
      return context.json({
        purchased: true,
        orderId,
        offerId: offer.id,
        entitlement: `${offer.id}:${orderId}`,
        message: "Payment verified. Retain the Payment-Receipt header with this order ID.",
      })
    },
  )
}

export default app
