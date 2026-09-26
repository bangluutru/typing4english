import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { en } from './src/i18n/en'
import { ja } from './src/i18n/ja'
import { vi } from './src/i18n/vi'

/**
 * Hands the per-language tab titles to the pre-paint script in index.html, so
 * the tab shows the right title from the first frame instead of flashing the
 * Japanese one. The strings stay in src/i18n (key 'meta.title'); nothing is
 * copied by hand.
 */
function tabTitles(): Plugin {
  const titles = JSON.stringify({ ja: ja['meta.title'], vi: vi['meta.title'], en: en['meta.title'] })
  return {
    name: 't4e-tab-titles',
    transformIndexHtml: html => {
      if (!html.includes('__T4E_TITLES__')) throw new Error('index.html: __T4E_TITLES__ placeholder missing')
      return html.replace('__T4E_TITLES__', titles)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tabTitles()],
})
