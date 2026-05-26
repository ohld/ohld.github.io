import { useEffect } from 'react'
import { SITE_IMAGE } from './site'

interface DocumentMeta {
  title: string
  description?: string
  canonical?: string
  lang?: string
  alternates?: Record<string, string>
  robots?: string
  image?: string
}

/**
 * Per-page <title>, <meta description>, og:* and canonical link.
 * Updates the existing tags rather than appending new ones — safe to call across navigations.
 */
export function useDocumentMeta({ title, description, canonical, lang = 'ru', alternates, robots = 'index, follow', image }: DocumentMeta) {
  useEffect(() => {
    document.title = title
    document.documentElement.lang = lang
    const ogLocale = lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU'
    const socialImage = image || SITE_IMAGE

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:locale', ogLocale)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:image', socialImage)
    setMeta('name', 'twitter:image', socialImage)

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
      setMeta('property', 'og:url', canonical)
      const nextAlternates = alternates || { ru: canonical, 'x-default': canonical }
      document
        .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
        .forEach((el) => {
          if (!nextAlternates[el.hreflang]) el.remove()
        })
      for (const [hrefLang, href] of Object.entries(nextAlternates)) {
        setHreflang(hrefLang, href)
      }
    }
  }, [title, description, canonical, lang, alternates, robots, image])
}

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  if (!content) return
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setHreflang(lang: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${lang}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = 'alternate'
    el.hreflang = lang
    document.head.appendChild(el)
  }
  el.href = href
}
