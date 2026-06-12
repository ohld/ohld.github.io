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
  faqItems?: FaqItem[]
}

const AUTHOR = {
  '@type': 'Person',
  name: 'Даниил Охлопков',
  alternateName: 'Daniil Okhlopkov',
  url: absoluteUrl('/'),
}

export interface FaqItem {
  question: string
  answer: string
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

export function faqItemsFromHtml(html = ''): FaqItem[] {
  if (!html) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items: FaqItem[] = []

  doc.querySelectorAll('section.article-faq').forEach((section) => {
    section.querySelectorAll('h3').forEach((questionEl) => {
      const answerParts: string[] = []
      let node = questionEl.nextElementSibling
      while (node && !/^H[23]$/.test(node.tagName)) {
        answerParts.push(node.textContent || '')
        node = node.nextElementSibling
      }

      const question = normalizePlainText(questionEl.textContent || '')
      const answer = normalizePlainText(answerParts.join(' '))
      if (question && answer) items.push({ question, answer })
    })
  })

  return items
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
  faqItems = [],
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

  if (faqItems.length) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        schema,
        {
          '@type': 'FAQPage',
          '@id': `${pageUrl}#faq`,
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    }
  }

  return schema
}
