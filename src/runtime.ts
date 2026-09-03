import type { RuntimeConfig } from "./types"

function escapeInlineJson(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
}

export function buildWebMcpCustomCode(config: RuntimeConfig) {
  const serializedConfig = escapeInlineJson(config)

  return `<script id="agentready-webmcp">
(() => {
  const config = ${serializedConfig};
  const modelContext = document.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    console.info("[AgentReady] WebMCP is not available in this browser.");
    return;
  }

  if (window.__agentReadyController) window.__agentReadyController.abort();
  const controller = new AbortController();
  window.__agentReadyController = controller;
  const enabled = new Set(config.capabilities);
  const register = (tool) => modelContext.registerTool(tool, { signal: controller.signal });
  const text = (value) => String(value ?? "").trim();
  const normalize = (value) => text(value).toLocaleLowerCase();

  if (enabled.has("siteSearch")) {
    register({
      name: "search_site",
      description: "Search the visible content of this website and return matching sections and links.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", minLength: 1 } },
        required: ["query"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async ({ query }) => {
        const needle = normalize(query);
        const candidates = [...document.querySelectorAll("h1,h2,h3,h4,p,li,a")];
        const matches = candidates
          .map((element) => ({
            text: text(element.textContent).replace(/\\s+/g, " ").slice(0, 400),
            url: element instanceof HTMLAnchorElement ? element.href : undefined
          }))
          .filter((item) => item.text && normalize(item.text).includes(needle))
          .slice(0, 20);
        return { query, matches, count: matches.length, page: location.href };
      }
    });
  }

  if (enabled.has("cmsSearch")) {
    register({
      name: "search_collection",
      description: "Search published Framer CMS content by collection name and keywords.",
      inputSchema: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name. Omit to search all collections." },
          query: { type: "string", description: "Keywords to find in CMS fields." },
          limit: { type: "integer", minimum: 1, maximum: 20, default: 10 }
        },
        required: ["query"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async ({ collection, query, limit = 10 }) => {
        const collectionNeedle = normalize(collection);
        const queryNeedle = normalize(query);
        const results = config.collections
          .filter((entry) => !collectionNeedle || normalize(entry.name).includes(collectionNeedle))
          .flatMap((entry) => entry.items
            .filter((item) => !item.draft && normalize(JSON.stringify(item.fields)).includes(queryNeedle))
            .map((item) => ({ collection: entry.name, slug: item.slug, fields: item.fields })))
          .slice(0, limit);
        return { query, results, count: results.length };
      }
    });

    register({
      name: "get_collection_item",
      description: "Get one Framer CMS item by its slug.",
      inputSchema: {
        type: "object",
        properties: { slug: { type: "string" }, collection: { type: "string" } },
        required: ["slug"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async ({ slug, collection }) => {
        const match = config.collections
          .filter((entry) => !collection || normalize(entry.name) === normalize(collection))
          .flatMap((entry) => entry.items.map((item) => ({ collection: entry.name, ...item })))
          .find((item) => item.slug === slug && !item.draft);
        return match ? { found: true, item: match } : { found: false, slug };
      }
    });
  }

  if (enabled.has("navigation")) {
    register({
      name: "navigate_to",
      description: "Navigate within this website or scroll a visible heading or section into view.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "A same-origin path such as /pricing." },
          section: { type: "string", description: "A visible heading, section label, or element id." }
        },
        additionalProperties: false
      },
      execute: async ({ path, section }) => {
        if (section) {
          const byId = document.getElementById(section);
          const byText = [...document.querySelectorAll("h1,h2,h3,h4,[data-framer-name]")]
            .find((element) => normalize(element.textContent).includes(normalize(section)));
          const target = byId || byText;
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            return { navigated: true, section, page: location.href };
          }
        }
        if (path) {
          const target = new URL(path, location.origin);
          if (target.origin !== location.origin) throw new Error("Only same-origin navigation is allowed.");
          location.assign(target.href);
          return { navigated: true, url: target.href };
        }
        return { navigated: false, reason: "No matching section or path was provided." };
      }
    });
  }

  if (enabled.has("formFill")) {
    register({
      name: "prefill_form",
      description: "Fill a visible form for the user to review. This tool never submits the form.",
      inputSchema: {
        type: "object",
        properties: {
          values: {
            type: "object",
            description: "Field names mapped to values.",
            additionalProperties: { type: ["string", "number", "boolean"] }
          },
          formIndex: { type: "integer", minimum: 0, default: 0 }
        },
        required: ["values"],
        additionalProperties: false
      },
      execute: async ({ values, formIndex = 0 }) => {
        const form = document.forms.item(formIndex);
        if (!form) return { filled: false, reason: "Form not found", formIndex };
        const updated = [];
        for (const [name, value] of Object.entries(values)) {
          const escaped = CSS.escape(name);
          const field = form.querySelector(
            '[name="' + escaped + '"],[id="' + escaped + '"],[aria-label="' + escaped + '"]'
          );
          if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) continue;
          if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
            field.checked = Boolean(value);
          } else {
            field.value = String(value);
          }
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
          updated.push(name);
        }
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        return { filled: true, updated, requiresUserReview: true };
      }
    });
  }

  if (enabled.has("formSubmit")) {
    register({
      name: "submit_form",
      description: "Submit a form after the user has reviewed its visible values. This causes an external side effect.",
      inputSchema: {
        type: "object",
        properties: { formIndex: { type: "integer", minimum: 0, default: 0 } },
        additionalProperties: false
      },
      annotations: { destructiveHint: true },
      execute: async ({ formIndex = 0 }) => {
        const form = document.forms.item(formIndex);
        if (!form) return { submitted: false, reason: "Form not found", formIndex };
        if (!form.reportValidity()) return { submitted: false, reason: "Form validation failed" };
        form.requestSubmit();
        return { submitted: true, formIndex };
      }
    });
  }

  window.dispatchEvent(new CustomEvent("agentready:ready", {
    detail: { capabilities: config.capabilities, generatedAt: config.generatedAt }
  }));
  console.info("[AgentReady] WebMCP tools registered", config.capabilities);
})();
</script>`
}
