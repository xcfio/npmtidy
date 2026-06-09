export type Reporter = "default" | "json" | "silent" | ((result: NpmTidyResult) => void)

/** The result passed to custom reporters and returned after a run */
export type NpmTidyResult = {
    /** Packages that were removed from package.json */
    removed: string[]
    /** Packages that were kept */
    kept: string[]
    /** Any errors encountered during the run */
    errors: string[]
}

export type NpmTidyConfig = {
    /**
     * Packages to never remove, regardless of usage.
     * Useful for build tools, peer deps, or type-only packages.
     */
    ignore?: string[]
    /**
     * Which dependency fields to check.
     * @default ["dependencies", "devDependencies"]
     */
    check?: ("dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies")[]
    /**
     * Glob patterns for files to scan for imports.
     * @default ["**\/*.{ts,tsx,js,jsx}"]
     */
    include?: string[]
    /**
     * Glob patterns for files to exclude from scanning.
     * @default ["node_modules/**", "dist/**"]
     */
    exclude?: string[]
    /**
     * If true, only report what would be removed without modifying package.json.
     * @default false
     */
    dry?: boolean
    /**
     * How to report results.
     * - `"default"` — pretty printed to stdout
     * - `"json"` — JSON output to stdout
     * - `"silent"` — no output
     * - `function` — custom reporter receiving the result object
     * @default "default"
     */
    reporter?: Reporter
    /** Plugins to extend or override npmtidy's behavior */
    plugins?: NpmTidyPlugin[]
}

export type NpmTidyPlugin = {
    /** Unique name for the plugin */
    name: string
    /**
     * Resolve a package name to an alias or null.
     * Return a string to treat it as that package instead, or null to skip.
     */
    resolve?: (pkg: string) => string | null
    /**
     * Filter whether a package should be kept.
     * Return false to force remove, true to keep.
     */
    filter?: (pkg: string, usages: string[]) => boolean
}

/**
 * Define npmtidy configuration with type safety.
 * @example
 * ```ts
 * export default defineConfig({ ignore: ["typescript"] })
 * ```
 */
export function defineConfig(config: NpmTidyConfig): NpmTidyConfig {
    return config
}

/**
 * Define a npmtidy plugin with type safety.
 * @example
 * ```ts
 * export const myPlugin = plugin({ name: "my-plugin", filter: (pkg) => true })
 * ```
 */
export function plugin(config: NpmTidyPlugin): NpmTidyPlugin {
    return config
}
