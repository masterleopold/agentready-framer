import { buildWebMcpCustomCode } from "../src/runtime"
import type { RuntimeConfig } from "../src/types"

const sentinelConfig: RuntimeConfig = {
  version: 1,
  projectName: "__AGENTREADY_CONFIG__",
  generatedAt: "1970-01-01T00:00:00.000Z",
  capabilities: [],
  collections: [],
}

const template = buildWebMcpCustomCode(sentinelConfig)
const sentinel = JSON.stringify(sentinelConfig)

process.stdout.write(`
const currentHtml = (await framer.getCustomCode()).bodyEnd.html || "";
const configStart = currentHtml.indexOf("const config = ");
const configEnd = currentHtml.indexOf(";\\n", configStart);
if (configStart < 0 || configEnd < 0) throw new Error("Installed AgentReady config was not found.");
const config = JSON.parse(currentHtml.slice(configStart + 15, configEnd));
config.generatedAt = new Date().toISOString();
const escapeInlineJson = (value) => JSON.stringify(value)
  .replaceAll("<", "\\\\u003c")
  .replaceAll(">", "\\\\u003e")
  .replaceAll("&", "\\\\u0026");
const template = ${JSON.stringify(template)};
const html = template.replace(${JSON.stringify(sentinel)}, escapeInlineJson(config));
if (!html.includes('callShopifyTool("ucp", cartId ? "update_cart" : "create_cart"')) {
  throw new Error("Generated runtime does not contain the Shopify UCP cart flow.");
}
await framer.setCustomCode({ html, location: "bodyEnd" });
console.log(JSON.stringify({ updated: true, generatedAt: config.generatedAt, characters: html.length, capabilities: config.capabilities.length }));
`)
