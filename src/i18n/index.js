import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'

export const LOCALE_KEY = 'apb_locale'
const DEFAULT_LOCALE = 'zh-CN'
const SUPPORT_LOCALES = ['zh-CN', 'en-US']

function resolveInitialLocale() {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored && SUPPORT_LOCALES.includes(stored)) {
    return stored
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export function setLocale(locale) {
  if (!SUPPORT_LOCALES.includes(locale)) {
    return
  }
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
}

