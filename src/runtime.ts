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
  const normalize = (value) => text(value).replace(/\\s+/g, " ").toLocaleLowerCase();
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const emit = (element, eventName) => element.dispatchEvent(new Event(eventName, { bubbles: true }));
  const isVisible = (element) => {
    if (!(element instanceof Element)) return false;
    if (element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true") return false;
    const style = element.getAttribute("style") || "";
    return !/display\\s*:\\s*none|visibility\\s*:\\s*hidden/i.test(style);
  };
  const fieldKey = (field) => text(field.name || field.id || field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.getAttribute("data-framer-name"));
  const fieldLabel = (field) => {
    const labelledBy = field.getAttribute("aria-labelledby");
    const labelled = labelledBy && document.getElementById(labelledBy);
    const explicit = field.id && document.querySelector('label[for="' + CSS.escape(field.id) + '"]');
    const wrapping = field.closest("label");
    return text(labelled?.textContent || explicit?.textContent || wrapping?.textContent || field.getAttribute("aria-label") || field.getAttribute("placeholder") || fieldKey(field)).replace(/\\s+/g, " ").slice(0, 160);
  };
  const sensitivePattern = /(?:^|[\\s_.-])(password|passcode|pin|otp|one[- ]?time|verification|security[- ]?code|cvv|cvc|card|pan|iban|swift|routing|bank[- ]?account|account[- ]?number|ssn|social[- ]?security)(?:$|[\\s_.-])/i;
  const paymentPattern = /checkout|payment|billing|credit|debit|card|pay now|place order|complete purchase|apple pay|google pay/i;
  const finalActionPattern = /submit|send|pay|purchase|place order|complete|confirm order|book now|register now|sign up/i;
  const sensitiveAutocomplete = /^(?:current-password|new-password|one-time-code|cc-number|cc-exp|cc-exp-month|cc-exp-year|cc-csc|transaction-currency|transaction-amount)$/i;
  const isSensitiveField = (field) => {
    const haystack = [fieldKey(field), fieldLabel(field), field.getAttribute("autocomplete"), field.getAttribute("data-framer-name")].filter(Boolean).join(" ");
    return field.type === "password" || sensitiveAutocomplete.test(text(field.getAttribute("autocomplete"))) || sensitivePattern.test(haystack);
  };
  const forms = () => {
    const result = [...document.forms];
    for (const container of document.querySelectorAll('[role="form"],[data-agentready-form]')) {
      if (!result.includes(container)) result.push(container);
    }
    return result;
  };
  const getForm = (formIndex = 0) => forms()[Number(formIndex) || 0] || null;
  const formFields = (form) => form ? [...form.querySelectorAll('input,textarea,select,[contenteditable="true"],[role="combobox"],[role="listbox"],[role="checkbox"],[role="radio"],[role="switch"],[role="slider"],[role="spinbutton"],[role="tab"],[aria-pressed]')].filter(isVisible) : [];
  const nativeValueSetter = (field, value) => {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(field, String(value)); else field.value = String(value);
    emit(field, "input"); emit(field, "change");
  };
  const nativeCheckedSetter = (field, checked) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
    if (setter) setter.call(field, Boolean(checked)); else field.checked = Boolean(checked);
    emit(field, "input"); emit(field, "change");
  };
  const findFields = (form, key) => {
    const needle = normalize(key); const candidates = formFields(form);
    const exact = candidates.filter((field) => [fieldKey(field), fieldLabel(field), field.getAttribute("value")].some((value) => normalize(value) === needle));
    return exact.length ? exact : candidates.filter((field) => [fieldKey(field), fieldLabel(field)].some((value) => normalize(value).includes(needle)));
  };
  const fieldOptions = (field) => {
    if (field instanceof HTMLSelectElement) return [...field.options].map((option) => ({ label: text(option.textContent), value: option.value, selected: option.selected, disabled: option.disabled }));
    if (field instanceof HTMLInputElement && (field.type === "radio" || field.type === "checkbox")) return [{ label: fieldLabel(field), value: field.value || "on", selected: field.checked, disabled: field.disabled }];
    const controls = field.getAttribute("aria-controls"); const owner = controls && document.getElementById(controls);
    return [...(owner || document).querySelectorAll('[role="option"]')].filter(isVisible).map((option) => ({ label: text(option.textContent), value: option.getAttribute("data-value") || text(option.textContent), selected: option.getAttribute("aria-selected") === "true", disabled: option.getAttribute("aria-disabled") === "true" }));
  };
  const describeField = (field, index) => {
    const sensitive = isSensitiveField(field);
    const kind = field instanceof HTMLInputElement ? field.type : field instanceof HTMLSelectElement ? (field.multiple ? "multi-select" : "select") : field instanceof HTMLTextAreaElement ? "textarea" : field.getAttribute("role") || (field.isContentEditable ? "contenteditable" : field.tagName.toLocaleLowerCase());
    return {
      index, key: fieldKey(field) || "field_" + index, label: fieldLabel(field), kind,
      required: field.required === true || field.getAttribute("aria-required") === "true",
      disabled: field.disabled === true || field.getAttribute("aria-disabled") === "true",
      readOnly: field.readOnly === true || field.getAttribute("aria-readonly") === "true",
      multiple: field.multiple === true || field.getAttribute("aria-multiselectable") === "true",
      autocomplete: sensitive ? undefined : field.getAttribute("autocomplete") || undefined,
      constraints: { min: field.getAttribute("min") || undefined, max: field.getAttribute("max") || undefined, step: field.getAttribute("step") || undefined, minLength: field.getAttribute("minlength") || undefined, maxLength: field.getAttribute("maxlength") || undefined, pattern: field.getAttribute("pattern") || undefined, accept: field.getAttribute("accept") || undefined },
      options: ["select", "multi-select", "radio", "checkbox", "combobox", "listbox"].includes(kind) ? fieldOptions(field) : undefined,
      sensitive,
      value: sensitive || kind === "file" ? undefined : (field.type === "checkbox" || field.type === "radio" ? Boolean(field.checked) : text(field.value || field.textContent)).toString().slice(0, 300)
    };
  };
  const describeForm = (form, formIndex) => {
    const fields = formFields(form).map(describeField);
    const buttons = [...form.querySelectorAll('button,input[type="button"],input[type="submit"],[role="button"]')].filter(isVisible).map((button) => ({ label: text(button.textContent || button.value || button.getAttribute("aria-label")), type: button.type || button.getAttribute("role") || "button", disabled: button.disabled === true || button.getAttribute("aria-disabled") === "true" })).filter((button) => button.label);
    const context = text((form.closest("section,main,article,dialog") || form).textContent).replace(/\\s+/g, " ").slice(0, 1000);
    const payment = paymentPattern.test([form.id, form.getAttribute("name"), form.getAttribute("aria-label"), form.getAttribute("data-framer-name"), context].filter(Boolean).join(" ")) || fields.some((field) => field.sensitive && /card|cvv|cvc|billing|payment/i.test(field.label + " " + field.key));
    return { formIndex, name: text(form.getAttribute("name") || form.id || form.getAttribute("aria-label") || form.getAttribute("data-framer-name")) || "Form " + (formIndex + 1), action: form instanceof HTMLFormElement ? form.action : undefined, method: form instanceof HTMLFormElement ? form.method : undefined, payment, fields, buttons };
  };
  const setField = (form, key, value) => {
    const targets = findFields(form, key); if (!targets.length) return { key, status: "not_found" };
    const safeTargets = targets.filter((field) => !isSensitiveField(field)); if (!safeTargets.length) return { key, status: "blocked_sensitive", requiresUserAction: true };
    const target = safeTargets[0];
    if (target.disabled || target.readOnly || target.getAttribute("aria-disabled") === "true") return { key, status: "unavailable" };
    if (target instanceof HTMLInputElement && target.type === "file") return { key, status: "requires_file_picker", requiresUserAction: true };
    const role = target.getAttribute("role");
    if (["checkbox", "switch"].includes(role) || target.hasAttribute("aria-pressed")) {
      const current = target.hasAttribute("aria-pressed") ? target.getAttribute("aria-pressed") === "true" : target.getAttribute("aria-checked") === "true";
      if (current !== Boolean(value)) target.click();
      return { key, status: "updated", value: Boolean(value) };
    }
    if (role === "radio" || role === "tab") {
      const wanted = normalize(value); const match = safeTargets.find((field) => normalize(field.getAttribute("data-value")) === wanted || normalize(fieldLabel(field)).includes(wanted));
      if (!match) return { key, status: "option_not_found" }; match.click(); return { key, status: "updated", value: text(match.getAttribute("data-value") || fieldLabel(match)) };
    }
    if (["slider", "spinbutton"].includes(role)) {
      const numeric = Number(value); if (!Number.isFinite(numeric)) return { key, status: "invalid_number" };
      target.focus(); target.setAttribute("aria-valuenow", String(numeric)); emit(target, "input"); emit(target, "change");
      return { key, status: "updated", value: numeric, bestEffortCustomControl: true };
    }
    if (target instanceof HTMLInputElement && target.type === "radio") {
      const wanted = normalize(value); const match = safeTargets.find((field) => normalize(field.value) === wanted || normalize(fieldLabel(field)).includes(wanted));
      if (!match) return { key, status: "option_not_found" }; nativeCheckedSetter(match, true); return { key, status: "updated", value: match.value };
    }
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const wanted = Array.isArray(value) ? value.map(normalize) : null;
      for (const checkbox of safeTargets) nativeCheckedSetter(checkbox, wanted ? wanted.some((entry) => entry === normalize(checkbox.value) || normalize(fieldLabel(checkbox)).includes(entry)) : Boolean(value));
      return { key, status: "updated", values: safeTargets.filter((field) => field.checked).map((field) => field.value) };
    }
    if (target instanceof HTMLSelectElement) {
      const wanted = (Array.isArray(value) ? value : [value]).map(normalize); let matches = 0;
      for (const option of target.options) { const selected = wanted.some((entry) => entry === normalize(option.value) || entry === normalize(option.textContent)); option.selected = selected; if (selected) matches += 1; }
      emit(target, "input"); emit(target, "change");
      return matches ? { key, status: "updated", values: [...target.selectedOptions].map((option) => option.value) } : { key, status: "option_not_found" };
    }
    if (target.isContentEditable) { target.focus(); target.textContent = String(value); emit(target, "input"); emit(target, "change"); }
    else nativeValueSetter(target, value);
    return { key, status: "updated" };
  };
  const fillValues = (form, values) => Object.entries(values || {}).map(([key, value]) => setField(form, key, value));
  const fillAddress = (form, address, scope) => {
    const mappings = {
      recipient: ["name", "recipient", "full name"], organization: ["organization", "company"], line1: ["address-line1", "address 1", "street"], line2: ["address-line2", "address 2", "apartment"], city: ["address-level2", "city"], region: ["address-level1", "state", "province", "region"], postalCode: ["postal-code", "zip", "postal"], country: ["country-name", "country"], countryCode: ["country", "country code"], phone: ["tel", "phone"], email: ["email"]
    };
    const results = [];
    for (const [property, value] of Object.entries(address || {})) {
      if (value === undefined || value === null || value === "") continue;
      const aliases = mappings[property] || [property];
      const fields = formFields(form);
      const scoped = fields.find((field) => {
        const autocomplete = normalize(field.getAttribute("autocomplete"));
        const scopeMatches = !scope || !autocomplete || autocomplete.includes(scope);
        return scopeMatches && aliases.some((alias) => autocomplete.split(" ").includes(normalize(alias)));
      });
      const targetKey = scoped ? fieldKey(scoped) || fieldLabel(scoped) : aliases.find((alias) => findFields(form, alias).length) || property;
      results.push(setField(form, targetKey, value));
    }
    return results;
  };
  const currentStep = (form) => {
    const explicit = form.querySelector('[aria-current="step"],[data-current-step],[data-step][aria-current="true"]'); const progress = form.querySelector('progress,[role="progressbar"]');
    return { label: text(explicit?.textContent || explicit?.getAttribute("aria-label")) || undefined, value: progress?.value ?? progress?.getAttribute("aria-valuenow") ?? undefined, max: progress?.max ?? progress?.getAttribute("aria-valuemax") ?? undefined };
  };
  const selectCustomOption = async (form, key, values) => {
    const target = findFields(form, key).find((field) => ["combobox", "listbox"].includes(field.getAttribute("role")));
    if (!target) return { key, status: "not_found" }; if (isSensitiveField(target)) return { key, status: "blocked_sensitive", requiresUserAction: true };
    target.click(); await sleep(50); const wanted = (Array.isArray(values) ? values : [values]).map(normalize); const options = [...document.querySelectorAll('[role="option"]')].filter(isVisible);
    const matches = options.filter((option) => wanted.some((entry) => entry === normalize(option.getAttribute("data-value")) || entry === normalize(option.textContent)));
    for (const option of matches) option.click();
    return matches.length ? { key, status: "updated", values: matches.map((option) => text(option.textContent)) } : { key, status: "option_not_found", available: options.map((option) => text(option.textContent)).filter(Boolean).slice(0, 50) };
  };
  const conversationMessages = () => {
    const candidates = [...document.querySelectorAll('[data-message-author-role],[data-agentready-message],[role="log"] > *,[aria-live="polite"] > *,[class*="message" i]')].filter(isVisible);
    const unique = candidates.filter((candidate, index) => !candidates.some((other, otherIndex) => otherIndex !== index && other.contains(candidate) && normalize(other.textContent) === normalize(candidate.textContent)));
    return unique.map((element, index) => {
      const identity = [element.getAttribute("data-message-author-role"), element.getAttribute("data-role"), element.getAttribute("aria-label"), element.className].filter(Boolean).join(" ");
      const role = /assistant|bot|ai|agent/i.test(identity) ? "assistant" : /user|human|you/i.test(identity) ? "user" : "unknown";
      return { index, role, text: text(element.textContent).replace(/\\s+/g, " ").slice(0, 4000) };
    }).filter((message) => message.text);
  };
  const chatInput = () => [...document.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"],input[type="text"]')].filter((field) => isVisible(field) && !isSensitiveField(field)).find((field) => /message|chat|ask|prompt|reply|質問|メッセージ/i.test([fieldKey(field), fieldLabel(field), field.closest("form")?.textContent].filter(Boolean).join(" "))) || null;
  const composeChat = (message) => {
    const input = chatInput(); if (!input) return { composed: false, reason: "Chat input not found" };
    if (input.isContentEditable) { input.focus(); input.textContent = String(message); emit(input, "input"); } else nativeValueSetter(input, message);
    input.scrollIntoView({ behavior: "smooth", block: "center" }); return { composed: true, requiresUserReview: true, field: fieldKey(input) || fieldLabel(input) };
  };
  const shopify = config.shopify;
  const shopifyCartKey = "agentready:shopify-cart:" + (shopify?.storeDomain || "store");
  const shopifyRequest = async (query, variables = {}) => {
    if (!shopify?.storeDomain) throw new Error("Shopify is not configured.");
    const headers = { "Content-Type": "application/json" };
    if (shopify.publicAccessToken) headers["X-Shopify-Storefront-Access-Token"] = shopify.publicAccessToken;
    const response = await fetch("https://" + shopify.storeDomain + "/api/" + (shopify.apiVersion || "2026-07") + "/graphql.json", { method: "POST", headers, body: JSON.stringify({ query, variables }) });
    const payload = await response.json();
    if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.map((error) => error.message).join("; ") || "Shopify Storefront request failed.");
    return payload.data;
  };
  const cartFragment = 'fragment AgentReadyCart on Cart { id checkoutUrl totalQuantity note discountCodes { code applicable } cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } } lines(first: 50) { nodes { id quantity merchandise { ... on ProductVariant { id title product { handle title } price { amount currencyCode } selectedOptions { name value } } } } } }';
  const cartSummary = (cart) => cart ? { totalQuantity: cart.totalQuantity, note: cart.note || undefined, discountCodes: cart.discountCodes, cost: cart.cost, lines: cart.lines?.nodes || [], checkoutReady: Boolean(cart.checkoutUrl) } : null;
  const getShopifyCart = async () => {
    const id = sessionStorage.getItem(shopifyCartKey); if (!id) return null;
    const data = await shopifyRequest('query AgentReadyCart($id: ID!) { cart(id: $id) { ...AgentReadyCart } } ' + cartFragment, { id });
    return data.cart || null;
  };
  const persistShopifyCart = (cart) => { if (cart?.id) sessionStorage.setItem(shopifyCartKey, cart.id); return cartSummary(cart); };
  const paymentEndpoint = config.cloudflarePayments?.endpoint?.replace(new RegExp("/$"), "");
  const paymentHeaders = (response) => ({
    wwwAuthenticate: response.headers.get("WWW-Authenticate") || undefined,
    paymentRequired: response.headers.get("Payment-Required") || undefined,
    paymentResponse: response.headers.get("Payment-Response") || undefined,
    paymentReceipt: response.headers.get("Payment-Receipt") || undefined,
  });
  const hasForms = forms().length > 0;
  const hasConversation = conversationMessages().length > 0 || Boolean(chatInput());

  if (enabled.has("siteSearch")) register({ name: "search_site", description: "Search visible website content and return matching sections and links.", inputSchema: { type: "object", properties: { query: { type: "string", minLength: 1 } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async ({ query }) => { const needle = normalize(query); const matches = [...document.querySelectorAll("h1,h2,h3,h4,p,li,a")].map((element) => ({ text: text(element.textContent).replace(/\\s+/g, " ").slice(0, 400), url: element instanceof HTMLAnchorElement ? element.href : undefined })).filter((item) => item.text && normalize(item.text).includes(needle)).slice(0, 20); return { query, matches, count: matches.length, page: location.href }; } });

  if (enabled.has("cmsSearch")) {
    register({ name: "search_collection", description: "Search published Framer CMS content by collection name and keywords.", inputSchema: { type: "object", properties: { collection: { type: "string" }, query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20, default: 10 } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async ({ collection, query, limit = 10 }) => { const collectionNeedle = normalize(collection); const queryNeedle = normalize(query); const results = config.collections.filter((entry) => !collectionNeedle || normalize(entry.name).includes(collectionNeedle)).flatMap((entry) => entry.items.filter((item) => !item.draft && normalize(JSON.stringify(item.fields)).includes(queryNeedle)).map((item) => ({ collection: entry.name, slug: item.slug, fields: item.fields }))).slice(0, limit); return { query, results, count: results.length }; } });
    register({ name: "get_collection_item", description: "Get one published Framer CMS item by slug.", inputSchema: { type: "object", properties: { slug: { type: "string" }, collection: { type: "string" } }, required: ["slug"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async ({ slug, collection }) => { const match = config.collections.filter((entry) => !collection || normalize(entry.name) === normalize(collection)).flatMap((entry) => entry.items.map((item) => ({ collection: entry.name, ...item }))).find((item) => item.slug === slug && !item.draft); return match ? { found: true, item: match } : { found: false, slug }; } });
  }

  if (enabled.has("navigation")) register({ name: "navigate_to", description: "Navigate within this origin or scroll a matching visible section into view.", inputSchema: { type: "object", properties: { path: { type: "string" }, section: { type: "string" } }, additionalProperties: false }, execute: async ({ path, section }) => { if (section) { const target = document.getElementById(section) || [...document.querySelectorAll("h1,h2,h3,h4,[data-framer-name]")].find((element) => normalize(element.textContent).includes(normalize(section))); if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); return { navigated: true, section, page: location.href }; } } if (path) { const target = new URL(path, location.origin); if (target.origin !== location.origin) throw new Error("Only same-origin navigation is allowed."); location.assign(target.href); return { navigated: true, url: target.href }; } return { navigated: false, reason: "No matching section or path was provided." }; } });

  if (enabled.has("formFill") && hasForms) {
    register({ name: "inspect_forms", description: "Inspect visible forms, steps, field types, constraints, and choices. Sensitive values are never returned.", inputSchema: { type: "object", properties: { formIndex: { type: "integer", minimum: 0 } }, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async ({ formIndex } = {}) => { const available = forms(); const selected = Number.isInteger(formIndex) ? [available[formIndex]].filter(Boolean) : available; return { forms: selected.map((form) => ({ ...describeForm(form, available.indexOf(form)), step: currentStep(form) })), count: selected.length }; } });
    register({ name: "prefill_form", description: "Fill safe text, number, checkbox, radio, select, multi-select, date, time, toggle, slider, and rich-text fields without submitting. Password, payment, OTP, and bank fields are blocked.", inputSchema: { type: "object", properties: { values: { type: "object", additionalProperties: { type: ["string", "number", "boolean", "array"], items: { type: "string" } } }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["values"], additionalProperties: false }, execute: async ({ values, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { filled: false, reason: "Form not found", formIndex }; const results = fillValues(form, values); form.scrollIntoView({ behavior: "smooth", block: "center" }); return { filled: results.some((item) => item.status === "updated"), updated: results.filter((item) => item.status === "updated").map((item) => item.key), blocked: results.filter((item) => item.status !== "updated"), results, requiresUserReview: true, formIndex }; } });
    register({ name: "fill_address", description: "Fill a structured shipping or billing address using semantic autocomplete fields, including recipient, organization, street lines, city, region, postal code, country, phone, and email.", inputSchema: { type: "object", properties: { address: { type: "object", properties: { recipient: { type: "string" }, organization: { type: "string" }, line1: { type: "string" }, line2: { type: "string" }, city: { type: "string" }, region: { type: "string" }, postalCode: { type: "string" }, country: { type: "string" }, countryCode: { type: "string" }, phone: { type: "string" }, email: { type: "string" } }, additionalProperties: false }, scope: { type: "string", enum: ["shipping", "billing"] }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["address"], additionalProperties: false }, execute: async ({ address, scope, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { filled: false, reason: "Form not found" }; const results = fillAddress(form, address, scope); form.scrollIntoView({ behavior: "smooth", block: "center" }); return { filled: results.some((item) => item.status === "updated"), results, blocked: results.filter((item) => item.status !== "updated"), requiresUserReview: true }; } });
    register({ name: "select_form_options", description: "Select native or ARIA combobox, listbox, radio, checkbox, and multi-select options without submitting.", inputSchema: { type: "object", properties: { selections: { type: "object", additionalProperties: { type: ["string", "boolean", "array"], items: { type: "string" } } }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["selections"], additionalProperties: false }, execute: async ({ selections, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { selected: false, reason: "Form not found", formIndex }; const results = []; for (const [key, value] of Object.entries(selections)) { const nativeResult = setField(form, key, value); results.push(nativeResult.status === "not_found" ? await selectCustomOption(form, key, value) : nativeResult); } return { selected: results.some((item) => item.status === "updated"), results, requiresUserReview: true }; } });
    register({ name: "set_form_date", description: "Set a native date, date range, datetime-local, month, week, or time field, or choose a matching accessible calendar date.", inputSchema: { type: "object", properties: { field: { type: "string" }, value: { type: "string" }, endField: { type: "string" }, endValue: { type: "string" }, displayLabel: { type: "string" }, timeZone: { type: "string" }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["field", "value"], additionalProperties: false }, execute: async ({ field, value, endField, endValue, displayLabel, timeZone, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { updated: false, reason: "Form not found" }; const target = findFields(form, field).find((item) => !isSensitiveField(item)); if (!target) return { updated: false, reason: "Date field not found" }; if (target instanceof HTMLInputElement && ["date", "datetime-local", "month", "week", "time"].includes(target.type)) { nativeValueSetter(target, value); const rangeResult = endField && endValue ? setField(form, endField, endValue) : undefined; return { updated: true, field, value, endField, endValue, rangeResult, timeZone, requiresUserReview: true }; } target.click(); await sleep(50); const wanted = [value, displayLabel].filter(Boolean).map(normalize); const options = [...document.querySelectorAll('[role="gridcell"],[data-date],button[aria-label],button[title]')].filter(isVisible); const match = options.find((option) => wanted.some((entry) => [option.getAttribute("data-date"), option.getAttribute("data-value"), option.getAttribute("aria-label"), option.getAttribute("title"), option.textContent].some((candidate) => normalize(candidate) === entry))); if (!match) return { updated: false, reason: "Accessible calendar option not found", available: options.map((option) => text(option.getAttribute("aria-label") || option.getAttribute("data-date") || option.textContent)).filter(Boolean).slice(0, 62) }; match.click(); const rangeResult = endField && endValue ? setField(form, endField, endValue) : undefined; return { updated: true, field, value, endField, endValue, rangeResult, timeZone, requiresUserReview: true }; } });
    register({ name: "advance_form_step", description: "Move a multi-step form forward or backward. Final submit and payment actions are refused.", inputSchema: { type: "object", properties: { action: { type: "string", enum: ["next", "back"] }, buttonLabel: { type: "string" }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["action"], additionalProperties: false }, execute: async ({ action, buttonLabel, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { advanced: false, reason: "Form not found" }; const pattern = buttonLabel ? new RegExp(buttonLabel.replace(/[.*+?^$()|[\\]\\\\]/g, "\\$&"), "i") : action === "back" ? /back|previous|prev|戻る|前へ/i : /next|continue|proceed|次へ|続ける/i; const button = [...form.querySelectorAll('button,input[type="button"],input[type="submit"],[role="button"]')].filter(isVisible).find((candidate) => pattern.test(text(candidate.textContent || candidate.value || candidate.getAttribute("aria-label")))); if (!button) return { advanced: false, reason: "Step button not found", step: currentStep(form) }; const label = text(button.textContent || button.value || button.getAttribute("aria-label")); if (button.type === "submit" || finalActionPattern.test(label) || paymentPattern.test(label)) return { advanced: false, reason: "Final actions require a separate reviewed submission", blocked: label, requiresUserAction: true }; button.click(); await sleep(50); return { advanced: true, action, button: label, step: currentStep(form), requiresUserReview: true }; } });
    register({ name: "prepare_file_upload", description: "Locate and focus a file input, report its accepted formats and limits, and hand off the secure system file picker to the user.", inputSchema: { type: "object", properties: { field: { type: "string" }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["field"], additionalProperties: false }, execute: async ({ field, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { prepared: false, reason: "Form not found" }; const input = findFields(form, field).find((candidate) => candidate instanceof HTMLInputElement && candidate.type === "file"); if (!input) return { prepared: false, reason: "File input not found" }; input.focus(); input.scrollIntoView({ behavior: "smooth", block: "center" }); return { prepared: true, field: fieldKey(input) || fieldLabel(input), accept: input.accept || undefined, multiple: input.multiple, requiresUserAction: true, instruction: "Choose the file in the browser's secure file picker, then ask the agent to inspect the form again." }; } });
  }

  if (enabled.has("conversation") && hasConversation) {
    register({ name: "read_conversation", description: "Read visible user and assistant messages so an agent can continue a conversational UI.", inputSchema: { type: "object", properties: { sinceIndex: { type: "integer", minimum: 0, default: 0 }, limit: { type: "integer", minimum: 1, maximum: 50, default: 30 } }, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async ({ sinceIndex = 0, limit = 30 } = {}) => { const all = conversationMessages(); const messages = all.slice(sinceIndex, sinceIndex + limit); return { messages, count: messages.length, total: all.length, nextIndex: sinceIndex + messages.length }; } });
    register({ name: "compose_chat_message", description: "Prepare the next message in a visible chatbot input without sending it.", inputSchema: { type: "object", properties: { message: { type: "string", minLength: 1, maxLength: 8000 } }, required: ["message"], additionalProperties: false }, execute: async ({ message }) => composeChat(message) });
  }

  if (enabled.has("chatSend") && hasConversation) register({ name: "send_chat_message", description: "Send a message in a conversational UI, wait briefly, and return newly visible replies. This is an external action.", inputSchema: { type: "object", properties: { message: { type: "string", minLength: 1, maxLength: 8000 }, waitMilliseconds: { type: "integer", minimum: 0, maximum: 30000, default: 5000 } }, required: ["message"], additionalProperties: false }, annotations: { openWorldHint: true, untrustedContentHint: true }, execute: async ({ message, waitMilliseconds = 5000 }) => { const before = conversationMessages(); const composed = composeChat(message); if (!composed.composed) return { sent: false, ...composed }; const input = chatInput(); const form = input?.closest("form"); const button = form && [...form.querySelectorAll('button,input[type="submit"],[role="button"]')].filter(isVisible).find((candidate) => /send|submit|ask|arrow|送信/i.test(text(candidate.textContent || candidate.value || candidate.getAttribute("aria-label")))); if (button) button.click(); else if (form instanceof HTMLFormElement) form.requestSubmit(); else return { sent: false, reason: "Chat send control not found", composed: true, requiresUserAction: true }; const deadline = Date.now() + waitMilliseconds; let after = conversationMessages(); while (Date.now() < deadline && after.length <= before.length) { await sleep(150); after = conversationMessages(); } return { sent: true, newMessages: after.slice(before.length), nextIndex: after.length }; } });

  if (enabled.has("shopifyCommerce") && shopify?.storeDomain) {
    register({ name: "search_shopify_products", description: "Search the connected Shopify catalog and return purchasable variants with contextual prices.", inputSchema: { type: "object", properties: { query: { type: "string" }, first: { type: "integer", minimum: 1, maximum: 20, default: 10 } }, additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: true }, execute: async ({ query = "", first = 10 } = {}) => { const data = await shopifyRequest('query AgentReadyProducts($first: Int!, $query: String) { products(first: $first, query: $query) { nodes { id handle title description availableForSale featuredImage { url altText } variants(first: 25) { nodes { id title availableForSale quantityAvailable price { amount currencyCode } selectedOptions { name value } } } } } }', { first, query: query || null }); return { store: shopify.storeDomain, products: data.products.nodes, count: data.products.nodes.length }; } });
    register({ name: "inspect_shopify_cart", description: "Read the current Shopify cart without exposing its secret cart identifier or payment details.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: true }, execute: async () => ({ store: shopify.storeDomain, cart: cartSummary(await getShopifyCart()) }) });
    register({ name: "add_shopify_cart_line", description: "Create or update the buyer's Shopify cart by adding a selected merchandise variant. This changes external cart state but does not purchase.", inputSchema: { type: "object", properties: { merchandiseId: { type: "string", pattern: "^gid://shopify/ProductVariant/" }, quantity: { type: "integer", minimum: 1, maximum: 99, default: 1 }, attributes: { type: "array", maxItems: 20, items: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"], additionalProperties: false } } }, required: ["merchandiseId"], additionalProperties: false }, annotations: { openWorldHint: true }, execute: async ({ merchandiseId, quantity = 1, attributes = [] }) => { const existingId = sessionStorage.getItem(shopifyCartKey); const variables = { cartId: existingId, lines: [{ merchandiseId, quantity, attributes }] }; const data = existingId ? await shopifyRequest('mutation AgentReadyCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...AgentReadyCart } userErrors { field message code } warnings { message code } } } ' + cartFragment, variables) : await shopifyRequest('mutation AgentReadyCartCreate($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { ...AgentReadyCart } userErrors { field message code } warnings { message code } } } ' + cartFragment, { lines: variables.lines }); const result = existingId ? data.cartLinesAdd : data.cartCreate; if (result.userErrors?.length) return { added: false, errors: result.userErrors }; return { added: true, cart: persistShopifyCart(result.cart), warnings: result.warnings || [], requiresUserReview: true }; } });
    register({ name: "update_shopify_cart", description: "Update Shopify cart quantities, discount codes, buyer email or country, and order note before checkout.", inputSchema: { type: "object", properties: { lines: { type: "array", maxItems: 50, items: { type: "object", properties: { id: { type: "string" }, quantity: { type: "integer", minimum: 0, maximum: 99 } }, required: ["id", "quantity"], additionalProperties: false } }, discountCodes: { type: "array", maxItems: 20, items: { type: "string" } }, note: { type: "string", maxLength: 5000 }, buyer: { type: "object", properties: { email: { type: "string" }, countryCode: { type: "string", minLength: 2, maxLength: 2 } }, additionalProperties: false } }, additionalProperties: false }, annotations: { openWorldHint: true }, execute: async ({ lines, discountCodes, note, buyer } = {}) => { const cartId = sessionStorage.getItem(shopifyCartKey); if (!cartId) return { updated: false, reason: "Cart is empty" }; const operations = []; if (lines) operations.push(['mutation AgentReadyLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...AgentReadyCart } userErrors { field message code } } } ' + cartFragment, { cartId, lines }, "cartLinesUpdate"]); if (discountCodes) operations.push(['mutation AgentReadyDiscounts($cartId: ID!, $codes: [String!]!) { cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) { cart { ...AgentReadyCart } userErrors { field message code } } } ' + cartFragment, { cartId, codes: discountCodes }, "cartDiscountCodesUpdate"]); if (note !== undefined) operations.push(['mutation AgentReadyNote($cartId: ID!, $note: String) { cartNoteUpdate(cartId: $cartId, note: $note) { cart { ...AgentReadyCart } userErrors { field message code } } } ' + cartFragment, { cartId, note }, "cartNoteUpdate"]); if (buyer) operations.push(['mutation AgentReadyBuyer($cartId: ID!, $buyer: CartBuyerIdentityInput!) { cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyer) { cart { ...AgentReadyCart } userErrors { field message code } } } ' + cartFragment, { cartId, buyer: { ...buyer, countryCode: buyer.countryCode?.toUpperCase() } }, "cartBuyerIdentityUpdate"]); let cart = await getShopifyCart(); const errors = []; for (const [query, variables, key] of operations) { const data = await shopifyRequest(query, variables); const result = data[key]; errors.push(...(result.userErrors || [])); if (result.cart) cart = result.cart; } return { updated: operations.length > 0 && errors.length === 0, cart: persistShopifyCart(cart), errors, requiresUserReview: true }; } });
    register({ name: "prepare_shopify_checkout", description: "Return or open Shopify's hosted checkout for the reviewed cart. Payment credentials, wallet authentication, and final purchase confirmation remain human-only.", inputSchema: { type: "object", properties: { open: { type: "boolean", default: false } }, additionalProperties: false }, annotations: { openWorldHint: true }, execute: async ({ open = false } = {}) => { const cart = await getShopifyCart(); if (!cart?.checkoutUrl) return { ready: false, reason: "Cart is empty or checkout is unavailable" }; const checkoutUrl = new URL(cart.checkoutUrl); if (checkoutUrl.protocol !== "https:") throw new Error("Shopify checkout must use HTTPS."); if (open) location.assign(checkoutUrl.href); return { ready: true, checkoutUrl: checkoutUrl.href, opened: open, cart: cartSummary(cart), requiresUserAction: true, humanOnly: ["payment credentials", "3-D Secure or OTP", "wallet authentication", "final purchase confirmation"] }; } });
  }

  if (enabled.has("agenticPayments") && paymentEndpoint) {
    register({ name: "inspect_agentic_offers", description: "List paid offers exposed by the configured Cloudflare Agentic Payments Worker.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: true }, execute: async () => { const response = await fetch(paymentEndpoint + "/v1/offers", { headers: { Accept: "application/json" } }); if (!response.ok) return { available: false, status: response.status }; const payload = await response.json(); return { available: true, protocol: "MPP", endpoint: paymentEndpoint, ...payload }; } });
    register({ name: "request_agentic_payment", description: "Request an MPP payment challenge for an offer. A payment-capable agent fulfills the challenge with its own scoped key; wallet secrets never enter this page.", inputSchema: { type: "object", properties: { offerId: { type: "string", pattern: "^[a-zA-Z0-9_-]+$" } }, required: ["offerId"], additionalProperties: false }, annotations: { openWorldHint: true }, execute: async ({ offerId }) => { const url = paymentEndpoint + "/v1/offers/" + encodeURIComponent(offerId) + "/purchase"; const response = await fetch(url, { headers: { Accept: "application/json" } }); const headers = paymentHeaders(response); let payload; try { payload = await response.json(); } catch { payload = undefined; } if (response.status === 402) return { paymentRequired: true, protocol: headers.wwwAuthenticate?.includes("Payment") ? "MPP" : headers.paymentRequired ? "x402" : "HTTP 402", paymentEndpoint: url, challenge: headers, requiresPaymentClient: true, requiresUserApproval: true }; return { paymentRequired: false, paid: response.ok, status: response.status, receipt: headers.paymentReceipt || headers.paymentResponse, result: payload }; } });
  }

  if (enabled.has("payPerCrawl") && config.crawlMonetization) register({ name: "get_paid_crawl_policy", description: "Discover this site's paid structured-content endpoint, crawl price, permitted uses, and audit evidence.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async () => ({ provider: "Cloudflare Pay Per Crawl", betaRequired: true, endpoint: new URL("/agentready/content.json", location.origin).href, format: "application/json", schema: "https://agentready.dev/schemas/content/v1", pricing: { amount: config.crawlMonetization.pricePerRequest, currency: config.crawlMonetization.currency, unit: "successful HTTP content response" }, permittedPurposes: Object.entries(config.crawlMonetization.purposes).filter(([, allowed]) => allowed).map(([purpose]) => purpose === "aiInput" ? "ai-input" : purpose === "aiTrain" ? "ai-train" : purpose), contentUse: config.crawlMonetization.contentUse, payment: { unpaidStatus: 402, intentHeaders: ["crawler-exact-price", "crawler-max-price"], chargedHeader: "crawler-charged", identity: "Web Bot Auth" }, evidence: ["request URL", "timestamp", "signed payment intent", "crawler-charged", "content-digest"], legalNote: "Audit evidence is not by itself a universal copyright license." }) });

  if (enabled.has("checkoutAssist") && hasForms) {
    register({ name: "inspect_checkout", description: "Inspect checkout structure, safe billing and shipping fields, choices, and handoff requirements without exposing payment secrets.", inputSchema: { type: "object", properties: { formIndex: { type: "integer", minimum: 0 } }, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async ({ formIndex } = {}) => { const available = forms(); const checkoutForms = available.map((form, index) => describeForm(form, index)).filter((form) => form.payment || (Number.isInteger(formIndex) && form.formIndex === formIndex)); return { forms: checkoutForms, count: checkoutForms.length, policy: { agentMayPrepare: ["plan", "quantity", "contact", "billing address", "shipping address", "shipping method", "coupon"], humanOnly: ["card or bank credentials", "passwords and OTP", "wallet authentication", "final payment confirmation"] } }; } });
    register({ name: "prepare_checkout", description: "Prepare non-sensitive checkout fields and choices. Card, bank, password, OTP, and final payment actions remain human-only.", inputSchema: { type: "object", properties: { values: { type: "object", additionalProperties: { type: ["string", "number", "boolean", "array"], items: { type: "string" } } }, formIndex: { type: "integer", minimum: 0, default: 0 } }, required: ["values"], additionalProperties: false }, execute: async ({ values, formIndex = 0 }) => { const form = getForm(formIndex); if (!form) return { prepared: false, reason: "Checkout form not found" }; const results = fillValues(form, values); form.scrollIntoView({ behavior: "smooth", block: "center" }); return { prepared: results.some((item) => item.status === "updated"), results, blocked: results.filter((item) => item.status !== "updated"), requiresUserReview: true, requiresHumanPayment: true }; } });
  }

  if (enabled.has("formSubmit")) register({ name: "submit_form", description: "Submit a reviewed non-payment, non-authentication form. Checkout and sensitive forms are always refused.", inputSchema: { type: "object", properties: { formIndex: { type: "integer", minimum: 0, default: 0 } }, additionalProperties: false }, annotations: { destructiveHint: true, openWorldHint: true }, execute: async ({ formIndex = 0 }) => { const form = getForm(formIndex); if (!(form instanceof HTMLFormElement)) return { submitted: false, reason: "HTML form not found", formIndex }; const descriptor = describeForm(form, formIndex); if (descriptor.payment || descriptor.fields.some((field) => field.sensitive)) return { submitted: false, reason: "Payment, authentication, and sensitive forms require human submission", requiresUserAction: true, formIndex }; if (!form.reportValidity()) return { submitted: false, reason: "Form validation failed", formIndex }; form.requestSubmit(); return { submitted: true, formIndex }; } });

  window.dispatchEvent(new CustomEvent("agentready:ready", { detail: { capabilities: config.capabilities, generatedAt: config.generatedAt } }));
  console.info("[AgentReady] WebMCP tools registered", config.capabilities);
})();
</script>`
}
