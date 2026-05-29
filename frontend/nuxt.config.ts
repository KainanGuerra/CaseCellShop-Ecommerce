export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // server-only: used for SSR API calls inside Docker (NUXT_API_BASE=http://backend:3001)
    apiBase: process.env.NUXT_API_BASE ?? '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
  devtools: { enabled: true },
})
