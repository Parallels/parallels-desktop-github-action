import jest from "eslint-plugin-jest";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import github from 'eslint-plugin-github'
import pluginHeader from "eslint-plugin-header";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

pluginHeader.rules.header.meta.schema = false;

export default [
  {
    ignores: [
      "!**/.*",
      "**/node_modules/*",
      "/node_modules/*",
      "**/dist/*",
      "**/coverage/*",
      "**/__tests__/*",
      "**/*.json",
      "src/index.ts",
      "**/lib/*",
      "**/dist/",
      ".github/linters/eslint.config.mjs",
    ],
  }, github.getFlatConfigs().browser,
  github.getFlatConfigs().recommended,
  github.getFlatConfigs().react,
  ...github.getFlatConfigs().typescript, {
    plugins: {
      jest,
    },
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: {
        requireConfigFile: false,
        project: "tsconfig.eslint.json",

        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ["jest"],
        },
      },
    },

    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "i18n-text/no-en": "off",
      "import/no-commonjs": "off",
      "import/no-namespace": "off",
      "import/no-unresolved": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      semi: "off",
      "@typescript-eslint/space-before-function-paren": "off",
      "no-shadow": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },

    settings: {
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    }
  }];