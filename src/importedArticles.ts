import importedIndex from '../content/articles/imported-index.json'
import localizedGroups from '../content/articles/localized-groups.json'
import { getEnhancedArticleDescription, getEnhancedArticleTitle } from './articleSeoEnhancements'
import type { BlogListItem } from './blog'

type ArticleLang = 'ru' | 'en' | 'zh'
type LocalizedArticleGroup = Partial<Record<ArticleLang, string>> & {
  xDefault?: ArticleLang
}

export interface ImportedArticle {
  path: string
  slug: string
  title: string
  description: string
  lang: 'ru' | 'en' | 'zh'
  publishedAt: string
  updatedAt: string
  readingTime: string
  tags: string[]
  heroImage: string
}

const importedArticles = (importedIndex as ImportedArticle[]).map((article) => ({
  ...article,
  title: getEnhancedArticleTitle(article.path, article.title),
  description: getEnhancedArticleDescription(article.path, article.description),
}))
const localizedArticleGroups = localizedGroups as LocalizedArticleGroup[]
const articleLangs: ArticleLang[] = ['ru', 'en', 'zh']

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getImportedArticleByPath(pathname: string) {
  const current = canonicalPath(pathname)
  return importedArticles.find((article) => article.path === current) || null
}

export function getImportedArticles() {
  return importedArticles
}

export function importedArticleListItem(pathname: string): BlogListItem | null {
  const article = getImportedArticleByPath(pathname)
  if (!article) return null
  return {
    path: article.path,
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    tags: article.tags,
    thumbnail: article.heroImage,
  }
}

export function importedArticleListItems(paths: string[]) {
  return paths.map(importedArticleListItem).filter((item): item is BlogListItem => Boolean(item))
}

export function importedArticleAlternates(pathname: string) {
  const current = canonicalPath(pathname)
  const group = localizedArticleGroups.find((item) => articleLangs.some((lang) => item[lang] === current))
  if (!group) return null

  const alternates: Record<string, string> = {}
  for (const lang of articleLangs) {
    const href = group[lang]
    if (href) alternates[lang] = href
  }
  const fallbackLang = group.xDefault || articleLangs.find((lang) => group[lang])
  if (fallbackLang && group[fallbackLang]) alternates['x-default'] = group[fallbackLang]
  return alternates
}
