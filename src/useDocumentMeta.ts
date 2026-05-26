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
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  section?: string
  jsonLd?: Record<string, unknown> | null
}

/**
 * Per-page <title>, <meta description>, og:* and canonical link.
 * Updates the existing tags rather than appending new ones — safe to call across navigations.
 */
export function useDocumentMeta({
  title,
  description,
  canonical,
  lang = 'ru',
  alternates,
  robots = 'index, follow',
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = [],
  section,
  jsonLd,
}: DocumentMeta) {
  useEffect(() => {
    document.title = title
    document.documentElement.lang = lang
    const ogLocale = lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU'
    const socialImage = image || SITE_IMAGE

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:locale', ogLocale)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:image', socialImage)
    setMeta('name', 'twitter:image', socialImage)
    setArticleMeta(type, publishedTime, modifiedTime, tags, section)
    setJsonLd(jsonLd)

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
  }, [title, description, canonical, lang, alternates, robots, image, type, publishedTime, modifiedTime, tags, section, jsonLd])
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

function setArticleMeta(
  type: 'website' | 'article',
  publishedTime: string | undefined,
  modifiedTime: string | undefined,
  tags: string[],
  section: string | undefined,
) {
  if (type !== 'article') {
    removeMeta('property', /^article:/)
    return
  }
  setMeta('property', 'article:published_time', publishedTime)
  setMeta('property', 'article:modified_time', modifiedTime || publishedTime)
  setMeta('property', 'article:author', 'Даниил Охлопков')
  setMeta('property', 'article:section', section)
  setMultiMeta('property', 'article:tag', tags)
}

function setMultiMeta(attr: 'name' | 'property', key: string, values: string[]) {
  document.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`).forEach((el) => el.remove())
  for (const value of values.filter(Boolean)) {
    const el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.content = value
    document.head.appendChild(el)
  }
}

function removeMeta(attr: 'name' | 'property', keyPattern: RegExp) {
  document.querySelectorAll<HTMLMetaElement>(`meta[${attr}]`).forEach((el) => {
    const key = el.getAttribute(attr)
    if (key && keyPattern.test(key)) el.remove()
  })
}

function setJsonLd(data: Record<string, unknown> | null | undefined) {
  const id = 'page-structured-data'
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }

  const script = existing || document.createElement('script')
  script.id = id
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(data, null, 2)
  if (!existing) document.head.appendChild(script)
}
