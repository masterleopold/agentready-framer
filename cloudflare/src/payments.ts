import { env } from "cloudflare:workers"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Mppx, tempo } from "mppx/hono"

interface PaymentEnv {
  ALLOWED_ORIGIN: string
  MPP_SECRET_KEY: string
  MPP_RECIPIENT: `0x${string}`
  MPP_CURRENCY: string
  OFFER_AMOUNT: string
}

const workerEnv = env as PaymentEnv
const app = new Hono()
const payments = Mppx.create({
  methods: [tempo.charge({ testnet: true })],
  secretKey: workerEnv.MPP_SECRET_KEY,
})

app.use("*", cors({
  origin: workerEnv.ALLOWED_ORIGIN,
  allowMethods: ["GET", "OPTIONS"],
  allowHeaders: ["Accept", "Authorization", "Payment-Signature", "Payment-Required"],
  exposeHeaders: ["WWW-Authenticate", "Payment-Required", "Payment-Response", "Payment-Receipt"],
}))

app.get("/v1/offers", (context) => context.json({
  offers: [{
    id: "agentready-commerce-demo",
    title: "AgentReady agentic commerce demo",
    description: "A testnet digital purchase that demonstrates an HTTP 402 payment challenge and receipt.",
    amount: workerEnv.OFFER_AMOUNT,
    protocol: "MPP",
    network: "Tempo testnet",
  }],
}))

app.get(
  "/v1/offers/agentready-commerce-demo/purchase",
  payments.charge({
    amount: workerEnv.OFFER_AMOUNT,
    currency: workerEnv.MPP_CURRENCY,
    description: "AgentReady agentic commerce demo",
    recipient: workerEnv.MPP_RECIPIENT,
    externalId: "agentready-commerce-demo",
  }),
  (context) => context.json({
    purchased: true,
    offerId: "agentready-commerce-demo",
    entitlement: "agentready-demo-receipt",
    message: "Payment verified. The protocol receipt is attached to this response.",
  }),
)

export default app
