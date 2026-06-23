import { defineConfig } from "oxlint"

export default defineConfig({
    options: { typeAware: true },
    plugins: ["typescript"],
    jsPlugins: [{ name: "eslint-js", specifier: "oxlint-plugin-eslint" }],
    categories: {
        correctness: "error",
        suspicious: "error",
        pedantic: "error"
    },
    ignorePatterns: [
        "**/node_modules",
        "**/dist",
        "**/.turbo",
        "**/.next",
        "**/.temp",
        "**/out",
        "**/.expo",
        "**/.agents"
    ],
    rules: {
        "typescript/prefer-readonly-parameter-types": "off",
        "typescript/no-confusing-void-expression": "off",
        "typescript/switch-exhaustiveness-check": "off",
        "typescript/strict-boolean-expressions": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-empty-object-type": "off",
        "typescript/no-unsafe-argument": "off",
        "typescript/strict-void-return": "off",
        "eslint/max-lines-per-function": "off",
        "typescript/consistent-return": "off",
        "typescript/no-unsafe-return": "off",
        "eslint/no-warning-comments": "off",
        "typescript/no-explicit-any": "off",
        "eslint/no-useless-concat": "off",
        "typescript/no-namespace": "off",
        "eslint/no-shadow": "off",
        "eslint/max-depth": "off",
        "eslint/max-lines": "off",
        "typescript/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_"
            }
        ],
        "eslint-js/no-restricted-syntax": [
            "error",
            {
                selector: "NewExpression[callee.name='Date']",
                message: "Use Temporal API instead of Date."
            },
            {
                selector: "CallExpression[callee.object.name='Date']",
                message: "Use Temporal API instead of Date.now()/Date.parse()."
            },
            {
                selector: "Identifier[name='Date']",
                message: "Use Temporal API instead of Date."
            }
        ]
    }
})
