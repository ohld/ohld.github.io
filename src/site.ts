import localizedGroups from '../content/articles/localized-groups.json'
import importedIndex from '../content/articles/imported-index.json'

const DEFAULT_SITE_URL = 'https://okhlopkov.com'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
export const SITE_NAME = 'Даниил Охлопков'
export const SITE_TITLE = 'Даниил Охлопков — AI-агенты, данные, TON и Telegram'
export const SITE_DESCRIPTION = 'Практические разборы AI-агентов, Claude Code, Codex, MCP, TON-аналитики и Telegram-автоматизаций от Даниила Охлопкова.'
export const SITE_IMAGE = 'https://github.com/ohld.png'
export const SITE_THUMBNAIL = '/assets/site/article-fallback.webp'

export const socialLinks = [
  { label: 'Telegram', url: 'https://t.me/danokhlopkov' },
  { label: 'YouTube', url: 'https://youtube.com/@danokhlopkov' },
  { label: 'Instagram', url: 'https://instagram.com/d7733o' },
  { label: 'X', url: 'https://x.com/danokhlopkov' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/danokhlopkov/' },
  { label: 'GitHub', url: 'https://github.com/ohld' },
]

export const navLinks = [
  { path: '/', enPath: '/en/', ru: 'Главная', en: 'Home' },
  { path: '/ru/blog/', enPath: '/en/blog/', ru: 'Блог', en: 'Blog' },
  { path: '/ru/articles/', enPath: '/en/articles/', ru: 'Статьи', en: 'Articles' },
  { path: '/about', enPath: '/en/about/', ru: 'Обо мне', en: 'About' },
]

export const sectionNavLinks = navLinks.filter((link) => link.path !== '/ru/' && link.path !== '/')

type LocalizedArticleGroup = Partial<Record<'ru' | 'en' | 'zh', string>>
type PageLang = 'ru' | 'en' | 'zh'
type ImportedArticleLanguage = { path: string; lang: PageLang }

const staticLocalizedPairs: Array<{ ru: string; en: string }> = [
  { ru: '/', en: '/en/' },
  { ru: '/ru/blog/', en: '/en/blog/' },
  { ru: '/ru/articles/', en: '/en/articles/' },
  { ru: '/blog/', en: '/en/blog/' },
  { ru: '/articles/', en: '/en/articles/' },
  { ru: '/about/', en: '/en/about/' },
]
const articleLocalizedPairs = (localizedGroups as LocalizedArticleGroup[])
  .filter((group): group is LocalizedArticleGroup & { ru: string; en: string } => Boolean(group.ru && group.en))
  .map((group) => ({ ru: group.ru, en: group.en }))
const localizedPairs = [...staticLocalizedPairs, ...articleLocalizedPairs]
const importedArticleLangByPath = new Map(
  (importedIndex as ImportedArticleLanguage[]).map((article) => [canonicalPath(article.path), article.lang]),
)

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function localizedPath(pathname: string, lang: 'ru' | 'en') {
  const current = canonicalPath(pathname)
  const pair = localizedPairs.find((item) => item.ru === current || item.en === current)
  if (pair) return lang === 'en' ? pair.en : pair.ru
  const importedLang = importedArticleLangByPath.get(current)
  if (importedLang) {
    if (importedLang === lang) return current
    return lang === 'en' ? '/en/' : '/'
  }
  if (current.startsWith('/en/articles/')) return lang === 'en' ? current : '/ru/articles/'
  if (current.startsWith('/ru/articles/')) return lang === 'en' ? '/en/articles/' : current
  if (current.startsWith('/articles/')) return lang === 'en' ? '/en/articles/' : current
  if (current.startsWith('/en/blog/')) return lang === 'en' ? current : '/ru/blog/'
  if (current.startsWith('/ru/blog/')) return lang === 'en' ? '/en/blog/' : current
  if (current.startsWith('/blog/')) return lang === 'en' ? '/en/blog/' : current
  return lang === 'en' ? '/en/' : '/'
}

export function pageLangForPath(pathname: string): PageLang {
  const current = canonicalPath(pathname)
  if (current === '/en/' || current.startsWith('/en/')) return 'en'
  return importedArticleLangByPath.get(current) || 'ru'
}

export function shellLangForPath(pathname: string): 'ru' | 'en' {
  return pageLangForPath(pathname) === 'ru' ? 'ru' : 'en'
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${cleanPath}`
}
