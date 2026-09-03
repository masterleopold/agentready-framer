interface Env {
  CRAWLER_PRICE: string
  PAID_PATH_PREFIXES: string
  FRAMER_ORIGIN: string
}

type Heading = { level: number; text: string; id?: string }
type PageLink = { text: string; url: string }

function isPaidPath(pathname: string, env: Env) {
  return env.PAID_PATH_PREFIXES.split(",").map((value) => value.trim()).filter(Boolean).some((prefix) => pathname.startsWith(prefix))
}

function requestsInBandPricing(request: Request) {
  return /(?:^|[,;\s])pricing\s*=\s*in-band(?:$|[,;\s])/i.test(request.headers.get("cf-pay-per-crawl") ?? "")
}

function withCrawlerPrice(response: Response, request: Request, env: Env) {
  if (!requestsInBandPricing(request)) return response
  const headers = new Headers(response.headers)
  headers.set("crawler-price", env.CRAWLER_PRICE)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function textCollector(push: (value: string) => void): HTMLRewriterElementContentHandlers {
  let value = ""
  return {
    element(element) {
      value = ""
      element.onEndTag(() => {
        const normalized = value.replace(/\s+/g, " ").trim()
        if (normalized) push(normalized)
      })
    },
    text(chunk) { value += chunk.text },
  }
}

function toBase64(buffer: ArrayBuffer) {
  let binary = ""
  for (const value of new Uint8Array(buffer)) binary += String.fromCharCode(value)
  return btoa(binary)
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "content-type": "application/json; charset=utf-8" } })
}

async function structuredContent(request: Request, env: Env) {
  const requestUrl = new URL(request.url)
  const origin = new URL(env.FRAMER_ORIGIN)
  const sourcePath = requestUrl.searchParams.get("path") || "/"
  if (!sourcePath.startsWith("/") || sourcePath.startsWith("//")) return jsonError("path must be an origin-relative URL", 400)

  const sourceUrl = new URL(sourcePath, origin)
  if (sourceUrl.origin !== origin.origin) return jsonError("cross-origin retrieval is not allowed", 400)
  const upstream = await fetch(sourceUrl, { headers: { Accept: "text/html", "User-Agent": "AgentReady-Structured-Content/1.0" } })
  if (!upstream.ok || !(upstream.headers.get("content-type") ?? "").includes("text/html")) return jsonError("Framer page could not be read", 502)

  let title = ""
  let description: string | undefined
  let canonical = sourceUrl.href
  let language: string | undefined
  const headings: Heading[] = []
  const content: string[] = []
  let contentLength = 0
  const links: PageLink[] = []
  let headingText = ""
  let headingLevel = 0
  let headingId: string | undefined
  let linkText = ""
  let linkHref: string | null = null
  const rewriter = new HTMLRewriter()
    .on("html", { element: (element) => { language = element.getAttribute("lang") ?? undefined } })
    .on("title", textCollector((value) => { title = value }))
    .on('meta[name="description"]', { element: (element) => { description = element.getAttribute("content") ?? undefined } })
    .on('link[rel="canonical"]', { element: (element) => { const href = element.getAttribute("href"); if (href) canonical = new URL(href, sourceUrl).href } })
    .on("h1,h2,h3,h4,h5,h6", {
      element(element) {
        headingText = ""
        headingLevel = Number(element.tagName.slice(1))
        headingId = element.getAttribute("id") ?? undefined
        element.onEndTag(() => {
          const normalized = headingText.replace(/\s+/g, " ").trim()
          if (normalized && headings.length < 250) headings.push({ level: headingLevel, text: normalized.slice(0, 500), id: headingId })
        })
      },
      text(chunk) { headingText += chunk.text },
    })
    .on("main p,main li,main blockquote,main figcaption,article p,article li,article blockquote,article figcaption", textCollector((value) => {
      if (contentLength < 100000) { content.push(value); contentLength += value.length }
    }))
    .on("main a[href],article a[href]", {
      element(element) {
        linkText = ""
        linkHref = element.getAttribute("href")
        element.onEndTag(() => {
          if (linkHref && links.length < 500) links.push({ text: linkText.replace(/\s+/g, " ").trim().slice(0, 300), url: new URL(linkHref, sourceUrl).href })
        })
      },
      text(chunk) { linkText += chunk.text },
    })

  await rewriter.transform(upstream).text()
  const body = {
    schema: "https://agentready.dev/schemas/content/v1",
    version: 1,
    source: { url: sourceUrl.href, canonical, publisher: origin.hostname },
    retrievedAt: new Date().toISOString(),
    language,
    title,
    description,
    headings,
    content: content.join("\n").slice(0, 100000),
    links,
    provenance: { generatedBy: "AgentReady Cloudflare Worker", sourceContentType: upstream.headers.get("content-type") },
  }
  const serialized = JSON.stringify(body)
  const digest = toBase64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized)))
  const response = new Response(serialized, { headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300",
    "content-digest": `sha-256=:${digest}:`,
    "x-agentready-source": sourceUrl.href,
    vary: "cf-pay-per-crawl",
  } })
  return withCrawlerPrice(response, request, env)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/agentready/content.json") return structuredContent(request, env)

    const response = await fetch(request)
    if (!isPaidPath(url.pathname, env) || !response.ok) return response
    return withCrawlerPrice(response, request, env)
  },
} satisfies ExportedHandler<Env>
