import { env } from "cloudflare:workers"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Mppx, tempo } from "mppx/hono"

interface PaymentEnv {
  ALLOWED_ORIGIN: string
  MPP_SECRET_KEY: string
  MPP_RECIPIENT: `0x${string}`
  MPP_CURRENCY: string
  CREATOR_AMOUNT: string
  STUDIO_AMOUNT: string
  AGENCY_AMOUNT: string
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

const offers = [
  { id: "agentready-creator", title: "AgentReady Creator", description: "AgentReady for one Framer workspace.", amount: workerEnv.CREATOR_AMOUNT },
  { id: "agentready-studio", title: "AgentReady Studio", description: "AgentReady for up to five Framer workspaces.", amount: workerEnv.STUDIO_AMOUNT },
  { id: "agentready-agency", title: "AgentReady Agency", description: "AgentReady for unlimited client sites.", amount: workerEnv.AGENCY_AMOUNT },
] as const

app.get("/v1/offers", (context) => context.json({
  offers: offers.map((offer) => ({ ...offer, protocol: "MPP", network: "Tempo testnet", currency: workerEnv.MPP_CURRENCY })),
}))

for (const offer of offers) {
  app.get(
    "/v1/offers/" + offer.id + "/purchase",
    payments.charge({
      amount: offer.amount,
      currency: workerEnv.MPP_CURRENCY,
      description: offer.title,
      recipient: workerEnv.MPP_RECIPIENT,
      externalId: offer.id,
    }),
    (context) => context.json({
      purchased: true,
      offerId: offer.id,
      entitlement: offer.id + "-demo",
      message: "Payment verified. The protocol receipt is attached to this response.",
    }),
  )
}

export default app
