import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.vue',
    './components/**/*.vue',
    './layouts/**/*.vue',
    './app.vue',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
