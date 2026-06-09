#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineCommand, runMain } from "citty"
import { tidy } from "./tidy.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let pkg: any = {}

try {
    const pkgPath = path.resolve(__dirname, "../package.json")
    if (fs.existsSync(pkgPath)) {
        pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    }
} catch {}

const main = defineCommand({
    meta: {
        name: "npmtidy",
        version: pkg.version || "0.0.2",
        description: pkg.description || "A CLI tool for cleaning and organizing Node.js projects"
    },
    args: {
        allowErrors: {
            type: "boolean",
            alias: "e",
            description: "Attempt to proceed despite errors encountered while loading/parsing files",
            default: false
        },
        verbose: {
            type: "boolean",
            alias: "v",
            description: "Print verbose information about tidying operations to standard error",
            default: false
        },
        printCommands: {
            type: "boolean",
            alias: "x",
            description: "Print the package manager commands executed",
            default: false
        },
        diff: {
            type: "boolean",
            description:
                "Do not modify package.json or run package manager, but print unified diff and exit non-zero if not empty",
            default: false
        }
    },
    async run({ args }) {
        const cwd = process.cwd()
        try {
            const exitCode = await tidy({
                cwd,
                allowErrors: args.allowErrors,
                verbose: args.verbose,
                printCommands: args.printCommands,
                diffMode: args.diff
            })
            process.exit(0)
        } catch (err) {
            console.error("An error occurred during tidy execution:", err)
            process.exit(1)
        }
    }
})

runMain(main)
