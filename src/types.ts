export type CapabilityId =
  | "siteSearch"
  | "cmsSearch"
  | "navigation"
  | "formFill"
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
  capabilities: CapabilityId[]
  collections: CmsCollectionSnapshot[]
}
