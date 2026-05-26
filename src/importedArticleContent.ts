import importedContent from '../content/articles/imported-content.json'

interface ImportedArticleContent {
  path: string
  bodyHtml: string
}

const importedBodies = importedContent as ImportedArticleContent[]

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getImportedArticleBody(pathname: string) {
  const current = canonicalPath(pathname)
  return importedBodies.find((article) => article.path === current)?.bodyHtml || ''
}
