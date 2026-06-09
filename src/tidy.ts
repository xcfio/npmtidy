import fs from "node:fs"
import path from "node:path"
import { builtinModules } from "node:module"
import { loadConfig } from "c12"

export interface NpmTidyPlugin {
    name: string
    setup?(context: NpmTidyContext): void | Promise<void>
    parseFile?(file: { path: string; content: string }): string[] | undefined | Promise<string[] | undefined>
    classify?(packageName: string, file: { path: string; content: string }): "prod" | "dev" | undefined
    transform?(result: NpmTidyResult): void | NpmTidyResult | Promise<void | NpmTidyResult>
}

export interface NpmTidyConfig {
    exclude?: string[]
    preserve?: string[]
    overrides?: Record<string, "prod" | "dev">
    plugins?: NpmTidyPlugin[]
}

export interface NpmTidyContext {
    cwd: string
    config: NpmTidyConfig
}

export interface NpmTidyResult {
    dependencies: {
        used: Set<string>
        missing: Set<string>
        unused: Set<string>
    }
    devDependencies: {
        used: Set<string>
        missing: Set<string>
        unused: Set<string>
    }
}

export interface TidyOptions {
    cwd: string
    allowErrors?: boolean
    verbose?: boolean
    printCommands?: boolean
    diffMode?: boolean
}

// // 1. Comment Stripping
// export function stripComments(code: string): string {
//     let inString: string | null = null
//     let inComment: "single" | "multi" | null = null
//     let result = ""

//     for (let i = 0; i < code.length; i++) {
//         const char = code[i]
//         const next = code[i + 1]

//         if (inComment === "single") {
//             if (char === "\n" || char === "\r") {
//                 inComment = null
//                 result += char
//             }
//             continue
//         }

//         if (inComment === "multi") {
//             if (char === "*" && next === "/") {
//                 inComment = null
//                 i++ // skip '/'
//             }
//             continue
//         }

//         if (inString) {
//             if (char === "\\") {
//                 result += char + (next || "")
//                 i++
//                 continue
//             }
//             if (char === inString) {
//                 inString = null
//             }
//             result += char
//             continue
//         }

//         if (char === "/" && next === "/") {
//             inComment = "single"
//             i++
//             continue
//         }
//         if (char === "/" && next === "*") {
//             inComment = "multi"
//             i++
//             continue
//         }

//         if (char === "'" || char === '"' || char === "`") {
//             inString = char
//             result += char
//             continue
//         }

//         result += char
//     }

//     return result
// }

// // 2. Import Extraction from comment-stripped code
// export function extractImports(code: string): string[] {
//     const imports = new Set<string>()

//     // Static imports: import ... from 'pkg'
//     const staticImportRegex = /\bimport\s+([\s\S]*?)\bfrom\s+['"`]([^'"`]+)['"`]/g
//     let match
//     while ((match = staticImportRegex.exec(code)) !== null) {
//         imports.add(match[2])
//     }

//     // Side-effect imports: import 'pkg'
//     const sideEffectImportRegex = /\bimport\s+['"`]([^'"`]+)['"`]/g
//     while ((match = sideEffectImportRegex.exec(code)) !== null) {
//         // Exclude imports that match static import from keywords to avoid duplicate scanning
//         const specifier = match[1]
//         if (!specifier.trim().startsWith("from")) {
//             imports.add(specifier)
//         }
//     }

//     // Dynamic imports: import('pkg')
//     const dynamicImportRegex = /\bimport\(\s*['"`]([^'"`]+)['"`]\s*\)/g
//     while ((match = dynamicImportRegex.exec(code)) !== null) {
//         imports.add(match[1])
//     }

//     // Exports: export * from 'pkg'
//     const exportFromRegex = /\bexport\s+([\s\S]*?)\bfrom\s+['"`]([^'"`]+)['"`]/g
//     while ((match = exportFromRegex.exec(code)) !== null) {
//         imports.add(match[2])
//     }

//     // CommonJS: require('pkg')
//     const requireRegex = /\brequire\(\s*['"`]([^'"`]+)['"`]\s*\)/g
//     while ((match = requireRegex.exec(code)) !== null) {
//         imports.add(match[1])
//     }

//     return Array.from(imports)
// }

// export function getPackageName(importPath: string): string | null {
//     if (
//         !importPath ||
//         importPath.startsWith(".") ||
//         importPath.startsWith("/") ||
//         importPath.startsWith("\\") ||
//         (importPath.includes(":") && !importPath.startsWith("node:"))
//     ) {
//         return null
//     }

//     let name = importPath
//     if (name.startsWith("node:")) {
//         return null
//     }

//     if (builtinModules.includes(name)) {
//         return null
//     }

//     const parts = name.split("/")
//     if (name.startsWith("@")) {
//         if (parts.length >= 2) {
//             name = `${parts[0]}/${parts[1]}`
//         } else {
//             return null
//         }
//     } else {
//         name = parts[0]
//     }

//     if (builtinModules.includes(name)) {
//         return null
//     }

//     return name
// }

// // 3. Glob match helper
// export function matchesExclude(relPath: string, excludePatterns: string[]): boolean {
//     const normalized = relPath.replace(/\\/g, "/")
//     for (const pattern of excludePatterns) {
//         const normPattern = pattern.replace(/\\/g, "/")
//         const escaped = normPattern
//             .replace(/[.+^${}()|[\]\\]/g, "\\$&")
//             .replace(/\*\*/g, ".*")
//             .replace(/\*/g, "[^/]*")
//             .replace(/\?/g, ".")
//         const regex = new RegExp(`^${escaped}$`)
//         if (regex.test(normalized) || normalized.split("/").includes(normPattern)) {
//             return true
//         }
//     }
//     return false
// }

// // 4. File scanning
// export function scanDir(dir: string, exclude: string[] = []): string[] {
//     const files: string[] = []
//     const defaultExclude = new Set(["node_modules", "dist", "out", "build", ".git", ".github", ".temp"])

//     function recurse(current: string) {
//         let list: string[]
//         try {
//             list = fs.readdirSync(current)
//         } catch {
//             return
//         }

//         for (const file of list) {
//             const fullPath = path.join(current, file)
//             const relPath = path.relative(dir, fullPath)

//             if (defaultExclude.has(file) || matchesExclude(relPath, exclude)) {
//                 continue
//             }

//             let stat: fs.Stats
//             try {
//                 stat = fs.statSync(fullPath)
//             } catch {
//                 continue
//             }

//             if (stat.isDirectory()) {
//                 recurse(fullPath)
//             } else if (stat.isFile()) {
//                 const ext = path.extname(file)
//                 if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"].includes(ext)) {
//                     files.push(fullPath)
//                 }
//             }
//         }
//     }

//     recurse(dir)
//     return files
// }

// export function isDevFile(filePath: string, cwd: string): boolean {
//     const relPath = path.relative(cwd, filePath).replace(/\\/g, "/")
//     const baseName = path.basename(filePath)

//     const isRoot = !relPath.includes("/")
//     if (isRoot) {
//         if (baseName.includes(".config.") || baseName === "tsconfig.json" || baseName === "package.json") {
//             return true
//         }
//     }

//     const parts = relPath.split("/")
//     if (
//         parts.includes("test") ||
//         parts.includes("tests") ||
//         parts.includes("__tests__") ||
//         parts.includes("__mocks__") ||
//         parts.includes("stories")
//     ) {
//         return true
//     }

//     if (baseName.includes(".test.") || baseName.includes(".spec.") || baseName.includes(".stories.")) {
//         return true
//     }

//     return false
// }

// // 5. Binary Mapping from node_modules
// export function getPackageBins(cwd: string): Map<string, string> {
//     const binToPkg = new Map<string, string>()
//     const nodeModulesPath = path.join(cwd, "node_modules")
//     if (!fs.existsSync(nodeModulesPath)) return binToPkg

//     try {
//         const pkgs = fs.readdirSync(nodeModulesPath)

//         const scanPkgJson = (pkgDir: string, pkgName: string) => {
//             const pJsonPath = path.join(pkgDir, "package.json")
//             if (fs.existsSync(pJsonPath)) {
//                 try {
//                     const content = JSON.parse(fs.readFileSync(pJsonPath, "utf8"))
//                     if (content.bin) {
//                         if (typeof content.bin === "string") {
//                             binToPkg.set(content.name || pkgName, content.name || pkgName)
//                         } else if (typeof content.bin === "object") {
//                             for (const binName of Object.keys(content.bin)) {
//                                 binToPkg.set(binName, content.name || pkgName)
//                             }
//                         }
//                     }
//                 } catch {}
//             }
//         }

//         for (const pkg of pkgs) {
//             if (pkg.startsWith("@")) {
//                 const scopePath = path.join(nodeModulesPath, pkg)
//                 try {
//                     const subPkgs = fs.readdirSync(scopePath)
//                     for (const subPkg of subPkgs) {
//                         scanPkgJson(path.join(scopePath, subPkg), `${pkg}/${subPkg}`)
//                     }
//                 } catch {}
//             } else {
//                 scanPkgJson(path.join(nodeModulesPath, pkg), pkg)
//             }
//         }
//     } catch {}

//     return binToPkg
// }

// export function getDependenciesFromScripts(pkgJson: any, binToPkg: Map<string, string>): Set<string> {
//     const deps = new Set<string>()
//     if (!pkgJson.scripts) return deps

//     const binaryMap: Record<string, string> = {
//         tsc: "typescript",
//         prettier: "prettier",
//         eslint: "eslint",
//         rolldown: "rolldown",
//         vite: "vite",
//         vitest: "vitest",
//         jest: "jest",
//         lefthook: "lefthook",
//         commitlint: "commitlint",
//         tsup: "tsup",
//         rollup: "rollup",
//         webpack: "webpack",
//         esbuild: "esbuild",
//         tailwind: "tailwindcss",
//         tailwindcss: "tailwindcss"
//     }

//     for (const scriptVal of Object.values(pkgJson.scripts)) {
//         if (typeof scriptVal !== "string") continue
//         const words = scriptVal.match(/[a-zA-Z0-9_\-\/@]+/g) || []
//         for (const word of words) {
//             if (binaryMap[word]) {
//                 deps.add(binaryMap[word])
//             } else if (binToPkg.has(word)) {
//                 deps.add(binToPkg.get(word)!)
//             } else {
//                 deps.add(word)
//             }
//         }
//     }
//     return deps
// }

// export function getPreservedPackagesFromConfigs(cwd: string): Set<string> {
//     const preserved = new Set<string>()

//     const configMap: Record<string, string[]> = {
//         "tsconfig.json": ["typescript"],
//         "rolldown.config": ["rolldown"],
//         "prettier.config": ["prettier"],
//         ".prettierrc": ["prettier"],
//         "eslint.config": ["eslint"],
//         ".eslintrc": ["eslint"],
//         "commitlint.config": ["commitlint", "@commitlint/cli"],
//         "lefthook.yml": ["lefthook"],
//         "tailwind.config": ["tailwindcss"],
//         "postcss.config": ["postcss"],
//         "vite.config": ["vite"],
//         "webpack.config": ["webpack"],
//         "jest.config": ["jest"],
//         "vitest.config": ["vitest"],
//         "babel.config": ["@babel/core", "babel-loader"],
//         ".babelrc": ["@babel/core"],
//         "playwright.config": ["@playwright/test"]
//     }

//     try {
//         const files = fs.readdirSync(cwd)
//         for (const file of files) {
//             for (const [prefix, pkgs] of Object.entries(configMap)) {
//                 if (file === prefix || file.startsWith(prefix + ".")) {
//                     for (const pkg of pkgs) {
//                         preserved.add(pkg)
//                     }
//                 }
//             }
//         }
//     } catch {}

//     return preserved
// }

// // 6. Transitive Peer Dependency protection
// export async function resolvePeerDependencies(
//     usedDeps: Set<string>,
//     cwd: string,
//     verbose: boolean
// ): Promise<Set<string>> {
//     const peerDeps = new Set<string>()
//     const resolved = new Set<string>()
//     const toCheck = Array.from(usedDeps)

//     while (toCheck.length > 0) {
//         const pkg = toCheck.pop()!
//         if (resolved.has(pkg)) continue
//         resolved.add(pkg)

//         let peerDependencies: Record<string, string> | undefined

//         const localPkgPath = path.join(cwd, "node_modules", pkg, "package.json")
//         if (fs.existsSync(localPkgPath)) {
//             try {
//                 const manifest = JSON.parse(fs.readFileSync(localPkgPath, "utf8"))
//                 peerDependencies = manifest.peerDependencies
//             } catch {}
//         }

//         if (!peerDependencies) {
//             try {
//                 if (verbose) {
//                     console.error(`[npmtidy] Fetching manifest for ${pkg} to check peer dependencies...`)
//                 }
//                 const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
//                 if (res.ok) {
//                     const manifest: any = await res.json()
//                     peerDependencies = manifest.peerDependencies
//                 }
//             } catch {}
//         }

//         if (peerDependencies) {
//             for (const peer of Object.keys(peerDependencies)) {
//                 peerDeps.add(peer)
//                 if (!resolved.has(peer)) {
//                     toCheck.push(peer)
//                 }
//             }
//         }
//     }

//     return peerDeps
// }

// // 7. NPM Registry Lookup
// export async function fetchLatestVersion(pkgName: string): Promise<string> {
//     try {
//         const res = await fetch(`https://registry.npmjs.org/${pkgName}/latest`)
//         if (res.ok) {
//             const manifest: any = await res.json()
//             return `^${manifest.version}`
//         }
//     } catch {}
//     return "*"
// }

// // 8. Package manager utilities
// export function detectPackageManager(cwd: string): "npm" | "pnpm" | "yarn" | "bun" {
//     if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
//     if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
//     if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun"
//     return "npm"
// }

// // 9. LCS Diff Algorithm
// export function generateDiff(fileOld: string, fileNew: string, filename: string): string {
//     const oldLines = fileOld.split("\n")
//     const newLines = fileNew.split("\n")

//     const matrix: number[][] = Array(oldLines.length + 1)
//         .fill(null)
//         .map(() => Array(newLines.length + 1).fill(0))

//     for (let i = 1; i <= oldLines.length; i++) {
//         for (let j = 1; j <= newLines.length; j++) {
//             if (oldLines[i - 1] === newLines[j - 1]) {
//                 matrix[i][j] = matrix[i - 1][j - 1] + 1
//             } else {
//                 matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1])
//             }
//         }
//     }

//     const getDiff = (i: number, j: number): string[] => {
//         if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
//             const result = getDiff(i - 1, j - 1)
//             result.push(`  ${oldLines[i - 1]}`)
//             return result
//         } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
//             const result = getDiff(i, j - 1)
//             result.push(`+ ${newLines[j - 1]}`)
//             return result
//         } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
//             const result = getDiff(i - 1, j)
//             result.push(`- ${oldLines[i - 1]}`)
//             return result
//         }
//         return []
//     }

//     const diffLines: string[] = []
//     diffLines.push(`--- ${filename}`)
//     diffLines.push(`+++ ${filename}`)
//     return diffLines.concat(getDiff(oldLines.length, newLines.length)).join("\n")
// }

// 10. Core tidy function
export async function tidy(options: TidyOptions) /*: Promise<number>*/ {
    // const cwd = options.cwd
    // const allowErrors = options.allowErrors ?? false
    // const verbose = options.verbose ?? false
    // const printCommands = options.printCommands ?? false
    // const diffMode = options.diffMode ?? false
    // const pkgJsonPath = path.join(cwd, "package.json")
    // if (!fs.existsSync(pkgJsonPath)) {
    //     console.error(`Error: package.json not found in ${cwd}`)
    //     return 1
    // }
    // let pkgJson: any
    // let originalContent: string
    // try {
    //     originalContent = fs.readFileSync(pkgJsonPath, "utf8")
    //     pkgJson = JSON.parse(originalContent)
    // } catch (err) {
    //     console.error("Failed to parse package.json:", err)
    //     return 1
    // }
    // // Load config using c12
    // let config: NpmTidyConfig = {}
    // try {
    //     const loaded = await loadConfig<NpmTidyConfig>({
    //         name: "npmtidy",
    //         cwd,
    //         rcFile: false,
    //         packageJson: false
    //     })
    //     if (loaded.config) {
    //         config = loaded.config
    //     }
    // } catch (err) {
    //     if (!allowErrors) throw err
    //     console.error("Failed to load configuration:", err)
    // }
    // const exclude = config.exclude || []
    // const preserve = new Set(config.preserve || [])
    // const overrides = config.overrides || {}
    // // Plugin setup hook
    // const context: NpmTidyContext = { cwd, config }
    // for (const plugin of config.plugins || []) {
    //     if (plugin.setup) {
    //         await plugin.setup(context)
    //     }
    // }
    // // Auto-preserve configs and scripts
    // const binToPkg = getPackageBins(cwd)
    // const scriptDeps = getDependenciesFromScripts(pkgJson, binToPkg)
    // const configDeps = getPreservedPackagesFromConfigs(cwd)
    // for (const dep of scriptDeps) preserve.add(dep)
    // for (const dep of configDeps) preserve.add(dep)
    // // Scan files
    // const files = scanDir(cwd, exclude)
    // const prodUsed = new Set<string>()
    // const devUsed = new Set<string>()
    // for (const file of files) {
    //     let content: string
    //     try {
    //         content = fs.readFileSync(file, "utf8")
    //     } catch (err) {
    //         if (!allowErrors) throw err
    //         console.error(`Failed to read file ${file}:`, err)
    //         continue
    //     }
    //     let fileImports: string[] = []
    //     let parsedByPlugin = false
    //     // Plugin parse hook
    //     for (const plugin of config.plugins || []) {
    //         if (plugin.parseFile) {
    //             try {
    //                 const res = await plugin.parseFile({ path: file, content })
    //                 if (res !== undefined) {
    //                     fileImports = res
    //                     parsedByPlugin = true
    //                     break
    //                 }
    //             } catch (err) {
    //                 if (!allowErrors) throw err
    //                 console.error(`Plugin '${plugin.name}' failed to parse ${file}:`, err)
    //             }
    //         }
    //     }
    //     if (!parsedByPlugin) {
    //         const stripped = stripComments(content)
    //         fileImports = extractImports(stripped)
    //     }
    //     for (const imp of fileImports) {
    //         const pkgName = getPackageName(imp)
    //         if (!pkgName) continue
    //         let classification: "prod" | "dev" | undefined
    //         // Plugin classify hook
    //         for (const plugin of config.plugins || []) {
    //             if (plugin.classify) {
    //                 try {
    //                     classification = plugin.classify(pkgName, { path: file, content })
    //                     if (classification !== undefined) {
    //                         break
    //                     }
    //                 } catch (err) {
    //                     if (!allowErrors) throw err
    //                     console.error(`Plugin '${plugin.name}' failed to classify ${pkgName}:`, err)
    //                 }
    //             }
    //         }
    //         if (classification === undefined) {
    //             if (overrides[pkgName]) {
    //                 classification = overrides[pkgName]
    //             } else {
    //                 classification = isDevFile(file, cwd) ? "dev" : "prod"
    //             }
    //         }
    //         if (classification === "prod") {
    //             prodUsed.add(pkgName)
    //         } else {
    //             devUsed.add(pkgName)
    //         }
    //     }
    // }
    // // Handle intersection (if used in both prod and dev, it's prod)
    // for (const prod of prodUsed) {
    //     devUsed.delete(prod)
    // }
    // // Resolve @types preservation
    // const allDepsInPkgJson = new Set([
    //     ...Object.keys(pkgJson.dependencies || {}),
    //     ...Object.keys(pkgJson.devDependencies || {})
    // ])
    // const preservedTypes = preserveTypes(new Set([...prodUsed, ...devUsed]), allDepsInPkgJson)
    // for (const dep of preservedTypes) {
    //     devUsed.add(dep)
    // }
    // // Peer dependency protection
    // const allUsedAndPreserved = new Set([...prodUsed, ...devUsed, ...preserve])
    // const peerDeps = await resolvePeerDependencies(allUsedAndPreserved, cwd, verbose)
    // for (const peer of peerDeps) {
    //     if (verbose) {
    //         console.error(`[npmtidy] Preserving peer dependency: ${peer}`)
    //     }
    //     // Retain peer dependency classification (put in devDependencies if only needed for dev, or dependencies. Default to dependencies unless already in devDependencies)
    //     if (pkgJson.devDependencies && pkgJson.devDependencies[peer]) {
    //         devUsed.add(peer)
    //     } else {
    //         prodUsed.add(peer)
    //     }
    // }
    // // Calculate changes
    // const originalDependencies = pkgJson.dependencies || {}
    // const originalDevDependencies = pkgJson.devDependencies || {}
    // const finalDependencies: Record<string, string> = {}
    // const finalDevDependencies: Record<string, string> = {}
    // const missingDeps: string[] = []
    // const missingDevDeps: string[] = []
    // const unusedDeps: string[] = []
    // const unusedDevDeps: string[] = []
    // // Process production dependencies
    // for (const pkg of prodUsed) {
    //     if (originalDependencies[pkg]) {
    //         finalDependencies[pkg] = originalDependencies[pkg]
    //     } else if (originalDevDependencies[pkg]) {
    //         // Move from dev to prod
    //         finalDependencies[pkg] = originalDevDependencies[pkg]
    //     } else {
    //         missingDeps.push(pkg)
    //     }
    // }
    // for (const pkg of devUsed) {
    //     if (originalDevDependencies[pkg]) {
    //         finalDevDependencies[pkg] = originalDevDependencies[pkg]
    //     } else if (originalDependencies[pkg]) {
    //         // Move from prod to dev
    //         finalDevDependencies[pkg] = originalDependencies[pkg]
    //     } else {
    //         missingDevDeps.push(pkg)
    //     }
    // }
    // // Handle preserved packages
    // for (const pkg of preserve) {
    //     // If it's already in dependencies or devDependencies, keep it where it is
    //     if (originalDependencies[pkg]) {
    //         finalDependencies[pkg] = originalDependencies[pkg]
    //     } else if (originalDevDependencies[pkg]) {
    //         finalDevDependencies[pkg] = originalDevDependencies[pkg]
    //     } else {
    //         // Not present, default to devDependencies for tooling/configs
    //         missingDevDeps.push(pkg)
    //     }
    // }
    // // Identify unused packages (present in original, but not in final)
    // for (const pkg of Object.keys(originalDependencies)) {
    //     if (!finalDependencies[pkg] && !finalDevDependencies[pkg]) {
    //         unusedDeps.push(pkg)
    //     }
    // }
    // for (const pkg of Object.keys(originalDevDependencies)) {
    //     if (!finalDependencies[pkg] && !finalDevDependencies[pkg]) {
    //         unusedDevDeps.push(pkg)
    //     }
    // }
    // // Fetch versions for missing packages
    // for (const pkg of missingDeps) {
    //     if (verbose) {
    //         console.error(`[npmtidy] Resolving version for missing dependency: ${pkg}`)
    //     }
    //     finalDependencies[pkg] = await fetchLatestVersion(pkg)
    // }
    // for (const pkg of missingDevDeps) {
    //     if (verbose) {
    //         console.error(`[npmtidy] Resolving version for missing devDependency: ${pkg}`)
    //     }
    //     finalDevDependencies[pkg] = await fetchLatestVersion(pkg)
    // }
    // // Construct final package.json
    // const finalPkgJson = { ...pkgJson }
    // if (Object.keys(finalDependencies).length > 0) {
    //     // Sort dependencies alphabetically
    //     finalPkgJson.dependencies = Object.keys(finalDependencies)
    //         .sort()
    //         .reduce(
    //             (acc, key) => {
    //                 acc[key] = finalDependencies[key]
    //                 return acc
    //             },
    //             {} as Record<string, string>
    //         )
    // } else {
    //     delete finalPkgJson.dependencies
    // }
    // if (Object.keys(finalDevDependencies).length > 0) {
    //     // Sort devDependencies alphabetically
    //     finalPkgJson.devDependencies = Object.keys(finalDevDependencies)
    //         .sort()
    //         .reduce(
    //             (acc, key) => {
    //                 acc[key] = finalDevDependencies[key]
    //                 return acc
    //             },
    //             {} as Record<string, string>
    //         )
    // } else {
    //     delete finalPkgJson.devDependencies
    // }
    // // Plugin transform hook
    // let result: NpmTidyResult = {
    //     dependencies: {
    //         used: prodUsed,
    //         missing: new Set(missingDeps),
    //         unused: new Set(unusedDeps)
    //     },
    //     devDependencies: {
    //         used: devUsed,
    //         missing: new Set(missingDevDeps),
    //         unused: new Set(unusedDevDeps)
    //     }
    // }
    // for (const plugin of config.plugins || []) {
    //     if (plugin.transform) {
    //         try {
    //             const transformed = await plugin.transform(result)
    //             if (transformed) {
    //                 result = transformed
    //             }
    //         } catch (err) {
    //             if (!allowErrors) throw err
    //             console.error(`Plugin '${plugin.name}' failed to transform results:`, err)
    //         }
    //     }
    // }
    // // Detect formatting of package.json to preserve it
    // let indent = 4
    // const matchIndent = originalContent.match(/^([ \t]+)"/m)
    // if (matchIndent) {
    //     indent = matchIndent[1].length
    // }
    // const newContent = JSON.stringify(finalPkgJson, null, indent) + "\n"
    // const hasChanges = originalContent !== newContent
    // if (diffMode) {
    //     if (hasChanges) {
    //         const diff = generateDiff(originalContent, newContent, "package.json")
    //         console.log(diff)
    //         return 1
    //     }
    //     return 0
    // }
    // if (!hasChanges) {
    //     if (verbose) {
    //         console.error("[npmtidy] No changes needed. package.json is tidy!")
    //     }
    //     return 0
    // }
    // // Write changes
    // fs.writeFileSync(pkgJsonPath, newContent, "utf8")
    // if (verbose) {
    //     for (const pkg of missingDeps) console.error(`[npmtidy] Added dependency: ${pkg}`)
    //     for (const pkg of missingDevDeps) console.error(`[npmtidy] Added devDependency: ${pkg}`)
    //     for (const pkg of unusedDeps) console.error(`[npmtidy] Removed dependency: ${pkg}`)
    //     for (const pkg of unusedDevDeps) console.error(`[npmtidy] Removed devDependency: ${pkg}`)
    // }
    // // Run package manager to update lockfile and node_modules
    // const pm = detectPackageManager(cwd)
    // const packagesToInstall: { name: string; isDev: boolean }[] = []
    // for (const pkg of missingDeps) packagesToInstall.push({ name: pkg, isDev: false })
    // for (const pkg of missingDevDeps) packagesToInstall.push({ name: pkg, isDev: true })
    // const packagesToRemove = [...unusedDeps, ...unusedDevDeps]
    // if (packagesToInstall.length > 0) {
    //     if (verbose) {
    //         console.error(`[npmtidy] Installing new dependencies with ${pm}...`)
    //     }
    //     // We run the package manager installation to make sure lockfile is updated.
    //     // However, since we already updated package.json, we can simply run "install"
    //     // to update lockfile and install everything.
    //     const runCmd = (cmd: string) => {
    //         if (printCommands) console.log(`Executing: ${cmd}`)
    //         try {
    //             require("node:child_process").execSync(cmd, { cwd, stdio: "inherit" })
    //         } catch (err) {
    //             if (!allowErrors) throw err
    //             console.error(`Command failed: ${cmd}`, err)
    //         }
    //     }
    //     if (pm === "pnpm") runCmd("pnpm install")
    //     else if (pm === "yarn") runCmd("yarn install")
    //     else if (pm === "bun") runCmd("bun install")
    //     else runCmd("npm install")
    // }
    // if (packagesToRemove.length > 0) {
    //     if (verbose) {
    //         console.error(`[npmtidy] Removing unused dependencies with ${pm}...`)
    //     }
    //     const runCmd = (cmd: string) => {
    //         if (printCommands) console.log(`Executing: ${cmd}`)
    //         try {
    //             require("node:child_process").execSync(cmd, { cwd, stdio: "inherit" })
    //         } catch (err) {
    //             if (!allowErrors) throw err
    //             console.error(`Command failed: ${cmd}`, err)
    //         }
    //     }
    //     if (pm === "pnpm") runCmd(`pnpm remove ${packagesToRemove.join(" ")}`)
    //     else if (pm === "yarn") runCmd(`yarn remove ${packagesToRemove.join(" ")}`)
    //     else if (pm === "bun") runCmd(`bun remove ${packagesToRemove.join(" ")}`)
    //     else runCmd(`npm uninstall ${packagesToRemove.join(" ")}`)
    // }
    // return 0
}
