import { absoluteUrl, SITE_IMAGE } from './site'

export interface ArticleStructuredDataInput {
  title: string
  description: string
  canonical: string
  lang?: string
  publishedAt?: string
  updatedAt?: string
  image?: string
  tags?: string[]
  section?: string
  bodyText?: string
}

const AUTHOR = {
  '@type': 'Person',
  name: 'Даниил Охлопков',
  alternateName: 'Daniil Okhlopkov',
  url: absoluteUrl('/'),
}

export function normalizePlainText(text = '') {
  return text.replace(/\s+/g, ' ').trim()
}

export function htmlToPlainText(html = '') {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return normalizePlainText(doc.body.textContent || '')
}

export function markdownToPlainText(markdown = '') {
  return normalizePlainText(
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_>#|-]/g, ' ')
  )
}

export function buildArticleStructuredData({
  title,
  description,
  canonical,
  lang = 'ru',
  publishedAt,
  updatedAt,
  image,
  tags = [],
  section,
  bodyText,
}: ArticleStructuredDataInput) {
  const pageUrl = absoluteUrl(canonical).replace(/#.*$/, '')
  const articleUrl = `${pageUrl}#article-content`
  const text = normalizePlainText(bodyText)
  const keywordList = tags.filter(Boolean)
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': articleUrl,
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: AUTHOR,
    publisher: AUTHOR,
    image: image ? [absoluteUrl(image)] : [SITE_IMAGE],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    url: articleUrl,
    inLanguage: lang,
    keywords: keywordList,
    articleSection: section,
    about: keywordList.map((name) => ({ '@type': 'Thing', name })),
  }

  if (text) {
    schema.text = text
    schema.articleBody = text
  }

  for (const [key, value] of Object.entries(schema)) {
    if (
      value === undefined
      || value === ''
      || (Array.isArray(value) && value.length === 0)
    ) {
      delete schema[key]
    }
  }

  return schema
}
