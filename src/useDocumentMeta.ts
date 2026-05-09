import { useEffect } from 'react'

interface DocumentMeta {
  title: string
  description?: string
  canonical?: string
}

/**
 * Per-page <title>, <meta description>, og:* and canonical link.
 * Updates the existing tags rather than appending new ones — safe to call across navigations.
 */
export function useDocumentMeta({ title, description, canonical }: DocumentMeta) {
  useEffect(() => {
    document.title = title

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
      setMeta('property', 'og:url', canonical)
    }
  }, [title, description, canonical])
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
