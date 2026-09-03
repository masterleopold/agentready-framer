export const agentReadyContentSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:agentready:content:v1",
  title: "AgentReady paid structured content",
  type: "object",
  required: ["schema", "version", "source", "retrievedAt", "title", "headings", "content", "links", "structuredData", "license", "provenance"],
  properties: {
    schema: { type: "string", format: "uri" },
    version: { const: 1 },
    source: {
      type: "object",
      required: ["url", "canonical", "publisher"],
      properties: {
        url: { type: "string", format: "uri" },
        canonical: { type: "string", format: "uri" },
        publisher: { type: "string" },
      },
      additionalProperties: false,
    },
    retrievedAt: { type: "string", format: "date-time" },
    language: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    headings: {
      type: "array",
      items: {
        type: "object",
        required: ["level", "text"],
        properties: { level: { type: "integer", minimum: 1, maximum: 6 }, text: { type: "string" }, id: { type: "string" } },
        additionalProperties: false,
      },
    },
    content: { type: "string", maxLength: 100000 },
    links: {
      type: "array",
      items: {
        type: "object",
        required: ["text", "url"],
        properties: { text: { type: "string" }, url: { type: "string", format: "uri" } },
        additionalProperties: false,
      },
    },
    structuredData: { type: "array", items: {} },
    license: {
      type: "object",
      required: ["contentUse", "permittedPurposes", "attributionRequired"],
      properties: {
        identifier: { type: "string" },
        url: { type: "string", format: "uri" },
        contentUse: { enum: ["reference", "full"] },
        permittedPurposes: { type: "array", items: { enum: ["search", "ai-input", "ai-train"] }, uniqueItems: true },
        attributionRequired: { type: "boolean" },
      },
      additionalProperties: false,
    },
    provenance: {
      type: "object",
      required: ["generatedBy", "sourceContentType"],
      properties: {
        generatedBy: { type: "string" },
        sourceContentType: { type: ["string", "null"] },
        requestId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const
