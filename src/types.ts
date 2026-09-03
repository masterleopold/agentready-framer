export type CapabilityId =
  | "siteSearch"
  | "cmsSearch"
  | "navigation"
  | "formFill"
  | "conversation"
  | "chatSend"
  | "checkoutAssist"
  | "shopifyCommerce"
  | "agenticPayments"
  | "payPerCrawl"
  | "cloudflareKnowledge"
  | "formSubmit"

export interface CmsFieldSnapshot {
  id: string
  name: string
  type: string
}

export interface CmsItemSnapshot {
  slug: string
  draft: boolean
  fields: Record<string, unknown>
}

export interface CmsCollectionSnapshot {
  id: string
  name: string
  fields: CmsFieldSnapshot[]
  items: CmsItemSnapshot[]
}

export interface SiteScan {
  projectName: string
  scannedAt: string
  nodes: number
  textLayers: number
  links: number
  formCandidates: number
  collections: CmsCollectionSnapshot[]
}

export interface RuntimeConfig {
  version: 1
  projectName: string
  generatedAt: string
  delivery?: {
    mode: "direct" | "hybrid" | "cloudflare"
    mcpPath: string
    contentCredentials: boolean
  }
  capabilities: CapabilityId[]
  collections: CmsCollectionSnapshot[]
  shopify?: {
    storeDomain: string
    connectionMode?: "auto" | "mcp" | "graphql"
    agentProfile?: string
    publicAccessToken?: string
    apiVersion: string
  }
  cloudflarePayments?: { endpoint: string }
  cloudflareIntelligence?: {
    endpoint: string
    telemetry: boolean
  }
  crawlMonetization?: {
    currency: "USD"
    pricePerRequest: string
    purposes: { search: boolean; aiInput: boolean; aiTrain: boolean }
    contentUse: "reference" | "full"
  }
}
