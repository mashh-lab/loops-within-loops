import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'
// import nextPlugin from "@next/eslint-plugin-next"; // Removed this direct import
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: tseslint.configs.recommended, // or other base config if needed
})

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '.next/', '.vercel/'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'), // Use compat.extends here
  {
    files: ['**/*.ts', '**/*.tsx'],
    // plugins: { // The plugins are now handled by compat.extends
    //   "@next/next": nextPlugin,
    // },
    extends: [eslintPluginPrettierRecommended], // Keep prettier separate
    // rules: { // Rules from next are included via compat.extends
    //   ...nextPlugin.configs.recommended.rules,
    //   ...nextPlugin.configs["core-web-vitals"].rules,
    //   // You can add custom rules here if needed
    //   // e.g. '@typescript-eslint/no-unused-vars': 'warn'
    // },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
)
