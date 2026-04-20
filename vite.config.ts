import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

function getManualVendorChunk(id: string) {
  if (!id.includes("node_modules")) {
    return undefined
  }

  if (id.includes("react-dom") || id.includes("react-router") || id.match(/[\\/]node_modules[\\/]react[\\/]/)) {
    return "vendor-react"
  }

  if (id.includes("@tanstack/react-query") || id.includes("axios")) {
    return "vendor-data"
  }

  if (id.includes("recharts") || id.includes("d3-")) {
    return "vendor-charts"
  }

  if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("react-toastify") || id.includes("cmdk")) {
    return "vendor-ui"
  }

  if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
    return "vendor-forms"
  }

  if (id.includes("i18next") || id.includes("react-i18next")) {
    return "vendor-i18n"
  }

  if (id.includes("socket.io-client") || id.includes("engine.io-client")) {
    return "vendor-realtime"
  }

  return "vendor-misc"
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return getManualVendorChunk(id)
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
