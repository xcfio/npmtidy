import { defineConfig } from "rolldown"

export default defineConfig({
    input: "src/index.ts",
    output: { file: "out/index.js", format: "esm" },
    external: (id, _importer, isResolved) => {
        if (isResolved) return false
        return !id.startsWith("@repo/") && !id.startsWith(".")
    }
})
