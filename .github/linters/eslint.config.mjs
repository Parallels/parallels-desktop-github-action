import { defineConfig, globalIgnores } from 'eslint/config'
import jest from 'eslint-plugin-jest'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import github from 'eslint-plugin-github'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
  plugins: {
    github
  }
})

export default defineConfig([
  globalIgnores([
    '!**/.*',
    '**/node_modules/.*',
    '**/dist/.*',
    '**/coverage/.*',
    '**/__tests__/.*',
    '**/*.json',
    'src/index.ts',
    '**/*.config.mjs',
    'coverage/**',
    'dist/**'
  ]),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:prettier/recommended',
      'plugin:jest/recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended'
    ),

    plugins: {
      jest
    },

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,
        project: 'tsconfig.eslint.json',

        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['jest']
        }
      }
    },

    rules: {
      camelcase: 'off',
      'eslint-comments/no-use': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'i18n-text/no-en': 'off',
      'import/no-commonjs': 'off',
      'import/no-namespace': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      semi: 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off'
    }
  }
])
