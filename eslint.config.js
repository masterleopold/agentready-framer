import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-globals": [
        "error",
        { name: "alert", message: "Native dialogs are unsupported in Framer plugins. Render confirmation UI inside the plugin." },
        { name: "confirm", message: "Native dialogs are unsupported in Framer plugins. Render confirmation UI inside the plugin." },
        { name: "prompt", message: "Native dialogs are unsupported in Framer plugins. Render confirmation UI inside the plugin." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "alert", message: "Native dialogs are unsupported in Framer plugins." },
        { object: "window", property: "confirm", message: "Native dialogs are unsupported in Framer plugins." },
        { object: "window", property: "prompt", message: "Native dialogs are unsupported in Framer plugins." },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
)
