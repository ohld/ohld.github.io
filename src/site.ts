const DEFAULT_SITE_URL = 'https://okhlopkov.com'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
export const SITE_NAME = 'Даниил Охлопков'
export const SITE_TITLE = 'Даниил Охлопков — AI-агенты, данные, TON и Telegram'
export const SITE_DESCRIPTION = 'Практические разборы AI-агентов, Claude Code, Codex, MCP, TON-аналитики и Telegram-автоматизаций от Даниила Охлопкова.'
export const SITE_IMAGE = 'https://github.com/ohld.png'

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
  { path: '/blog', enPath: '/en/blog/', ru: 'Блог', en: 'Blog' },
  { path: '/articles', enPath: '/en/articles/', ru: 'Статьи', en: 'Articles' },
  { path: '/about', enPath: '/en/about/', ru: 'Обо мне', en: 'About' },
]

export function isEnglishPath(pathname: string) {
  return pathname === '/en' || pathname.startsWith('/en/')
}

const localizedPairs: Array<{ ru: string; en: string }> = [
  { ru: '/', en: '/en/' },
  { ru: '/blog/', en: '/en/blog/' },
  { ru: '/articles/', en: '/en/articles/' },
  { ru: '/about/', en: '/en/about/' },
  { ru: '/claude-code-nastrojka-mcp-hooks-skills-2026/', en: '/claude-code-setup-mcp-hooks-skills-2026/' },
  { ru: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/', en: '/en-second-brain-obsidian-claude-code-assistant/' },
  { ru: '/claude-code-compaction-kak-rabotaet/', en: '/claude-code-compaction-explained/' },
  { ru: '/luchshie-skills-mcp-claude-code-agent-browser/', en: '/en-best-skills-mcp-claude-code-agent-browser/' },
  { ru: '/beads-gastown-framework-ai-agenty/', en: '/en-beads-gastown-framework-ai-agents/' },
  { ru: '/show-me-ai-setup-ghostty-ownyourchat-descript/', en: '/en-show-me-ai-setup-ghostty-ownyourchat-descript/' },
  { ru: '/claude-codex-dual-review/', en: '/en-claude-codex-dual-review/' },
  { ru: '/ai-agenty-habr-claude-code-golosovye-komandy/', en: '/en-ai-agents-practice-claude-code-voice-commands/' },
  { ru: '/telegram-mini-app-llms-txt-claude-code-stream/', en: '/en-telegram-mini-app-llms-txt-claude-code-stream/' },
  { ru: '/kak-pravilno-pisat-skilly-claude-code-7-oshibok/', en: '/en-write-claude-code-skills-7-mistakes/' },
  { ru: '/gde-najti-ideyu-saas-acquire-com-ai/', en: '/en-find-saas-ideas-acquire-com-ai-validation/' },
  { ru: '/sovety-sozdatel-claude-code-git-worktrees/', en: '/en-claude-code-creator-tips-git-worktrees/' },
  { ru: '/ai-agent-forum-telegram-chat-agenty/', en: '/en-ai-agent-forum-telegram-chat/' },
  { ru: '/ton-analyst-ai-skill-ton-blockchain-dune/', en: '/en-ton-analyst-open-source-ai-skill-dune/' },
  { ru: '/singularity-uzhe-sluchilas-analiz-5-metrik-ai/', en: '/en-singularity-already-happened-5-ai-metrics/' },
  { ru: '/prompty-uluchshili-opyt-ai-agenty-5-lajfhakov/', en: '/en-5-prompts-improved-ai-agent-workflow-claude-code/' },
  { ru: '/21-question-ai-agent/', en: '/21-questions-ai-agent-knowledge-gaps/' },
]

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function localizedPath(pathname: string, lang: 'ru' | 'en') {
  const current = canonicalPath(pathname)
  const pair = localizedPairs.find((item) => item.ru === current || item.en === current)
  if (pair) return lang === 'en' ? pair.en : pair.ru
  return lang === 'en' ? '/en/' : '/'
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${cleanPath}`
}
