import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // react-hooks/purity (React Compiler rule) flags Math.random() during
      // render. Our only violations are intentional decorative randomness
      // (confetti / header particles), not real impurity bugs. Keep it visible
      // as a warning instead of refactoring untested animation code on a live app.
      'react-hooks/purity': 'warn',
      // set-state-in-effect (React Compiler rule) flags idiomatic effects like
      // "close the mobile menu on route change" and "derive an error message from
      // a query error". These are intentional, not bugs; keep them as warnings
      // rather than risky refactors of customer-facing components without tests.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Generated shadcn/ui primitives co-export variants/helpers with their
    // components and use library-internal patterns, so the fast-refresh and
    // purity rules don't meaningfully apply to this vendored UI code.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
