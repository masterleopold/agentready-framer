import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import mkcert from "vite-plugin-mkcert"
import framer from "vite-plugin-framer"
import { readFileSync } from "node:fs"

const manualHttps =
  process.env.FRAMER_TLS_CERT && process.env.FRAMER_TLS_KEY
    ? {
        cert: readFileSync(process.env.FRAMER_TLS_CERT),
        key: readFileSync(process.env.FRAMER_TLS_KEY),
      }
    : undefined

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.FRAMER_HTTP === "1" || manualHttps ? [] : [mkcert()]),
    framer(),
  ],
  server: manualHttps ? { https: manualHttps } : undefined,
})
