import type { UserConfig } from "@commitlint/types"

const Configuration: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    formatter: "@commitlint/format",
    rules: {
        "header-max-length": [2, "always", 200],
        "body-max-line-length": [2, "always", 200]
    }
}

export default Configuration
