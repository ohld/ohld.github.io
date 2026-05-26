import importedContent from '../content/articles/imported-content.json'

interface ImportedArticleContent {
  path: string
  bodyHtml: string
}

const importedBodies = importedContent as ImportedArticleContent[]

function normalizeImportedArticleHtml(html: string) {
  return html
    .replace(
      /<a\b[^>]*\bhref=(["'])\/cdn-cgi\/l\/email-protection(?:#[^"']*)?\1[^>]*>[\s\S]*?<\/a>/gi,
      'DOKKU_LETSENCRYPT_EMAIL=you@example.com',
    )
    .replace(
      /\bhref=(["'])(?![a-z][a-z0-9+.-]*:|[/?#]|mailto:|tel:)([^"'\s>]+?\.[a-z]{2,}(?:[/?#][^"']*)?)\1/gi,
      (_match, quote: string, href: string) => `href=${quote}https://${href}${quote}`,
    )
}

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getImportedArticleBody(pathname: string) {
  const current = canonicalPath(pathname)
  return normalizeImportedArticleHtml(importedBodies.find((article) => article.path === current)?.bodyHtml || '')
}
