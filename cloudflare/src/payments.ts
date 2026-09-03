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
    id: "agentready-plugin-license",
    title: "AgentReady for Framer license",
    description: "A testnet purchase of the AgentReady plugin that demonstrates an HTTP 402 payment challenge and receipt.",
    amount: workerEnv.OFFER_AMOUNT,
    protocol: "MPP",
    network: "Tempo testnet",
  }],
}))

app.get(
  "/v1/offers/agentready-plugin-license/purchase",
  payments.charge({
    amount: workerEnv.OFFER_AMOUNT,
    currency: workerEnv.MPP_CURRENCY,
    description: "AgentReady for Framer plugin license",
    recipient: workerEnv.MPP_RECIPIENT,
    externalId: "agentready-plugin-license",
  }),
  (context) => context.json({
    purchased: true,
    offerId: "agentready-plugin-license",
    entitlement: "agentready-plugin-license-demo",
    message: "Payment verified. The protocol receipt is attached to this response.",
  }),
)

export default app
