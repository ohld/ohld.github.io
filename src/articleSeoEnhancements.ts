import seoEnhancements from '../content/articles/seo-enhancements.json'

interface ArticleSeoEnhancement {
  description?: string
  summaryHtml?: string
  relatedHtml?: string
  faqHtml?: string
}

const enhancements = seoEnhancements as Record<string, ArticleSeoEnhancement>

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getArticleSeoEnhancement(pathname: string) {
  return enhancements[canonicalPath(pathname)] || null
}

export function getEnhancedArticleDescription(pathname: string, fallback: string) {
  return getArticleSeoEnhancement(pathname)?.description || fallback
}

export function applyArticleSeoEnhancement(pathname: string, html: string) {
  if (!html || html.includes('data-seo-enhancement=')) return html
  const enhancement = getArticleSeoEnhancement(pathname)
  if (!enhancement) return html

  const summary = enhancement.summaryHtml
    ? `<section class="article-callout article-seo-summary" data-seo-enhancement="summary">${enhancement.summaryHtml}</section>`
    : ''
  const faq = enhancement.faqHtml
    ? `<section class="article-faq" data-seo-enhancement="faq">${enhancement.faqHtml}</section>`
    : ''
  const related = enhancement.relatedHtml
    ? `<section class="article-callout article-related" data-seo-enhancement="related">${enhancement.relatedHtml}</section>`
    : ''

  return `${summary}${html}${related}${faq}`
}
