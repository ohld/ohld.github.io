import importedIndex from '../content/articles/imported-index.json'
import type { BlogListItem } from './blog'

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

const importedArticles = importedIndex as ImportedArticle[]

const localizedPairs = [
  ['/', '/en/'],
  ['/blog/', '/en/blog/'],
  ['/articles/', '/en/articles/'],
  ['/about/', '/en/about/'],
  ['/claude-code-nastrojka-mcp-hooks-skills-2026/', '/claude-code-setup-mcp-hooks-skills-2026/'],
  ['/vtoroj-mozg-ai-assistent-obsidian-claude-code/', '/en-second-brain-obsidian-claude-code-assistant/'],
  ['/claude-code-compaction-kak-rabotaet/', '/claude-code-compaction-explained/'],
  ['/luchshie-skills-mcp-claude-code-agent-browser/', '/en-best-skills-mcp-claude-code-agent-browser/'],
  ['/beads-gastown-framework-ai-agenty/', '/en-beads-gastown-framework-ai-agents/'],
  ['/show-me-ai-setup-ghostty-ownyourchat-descript/', '/en-show-me-ai-setup-ghostty-ownyourchat-descript/'],
  ['/claude-codex-dual-review/', '/en-claude-codex-dual-review/'],
  ['/ai-agenty-habr-claude-code-golosovye-komandy/', '/en-ai-agents-practice-claude-code-voice-commands/'],
  ['/telegram-mini-app-llms-txt-claude-code-stream/', '/en-telegram-mini-app-llms-txt-claude-code-stream/'],
  ['/kak-pravilno-pisat-skilly-claude-code-7-oshibok/', '/en-write-claude-code-skills-7-mistakes/'],
  ['/gde-najti-ideyu-saas-acquire-com-ai/', '/en-find-saas-ideas-acquire-com-ai-validation/'],
  ['/sovety-sozdatel-claude-code-git-worktrees/', '/en-claude-code-creator-tips-git-worktrees/'],
  ['/ai-agent-forum-telegram-chat-agenty/', '/en-ai-agent-forum-telegram-chat/'],
  ['/ton-analyst-ai-skill-ton-blockchain-dune/', '/en-ton-analyst-open-source-ai-skill-dune/'],
  ['/singularity-uzhe-sluchilas-analiz-5-metrik-ai/', '/en-singularity-already-happened-5-ai-metrics/'],
  ['/prompty-uluchshili-opyt-ai-agenty-5-lajfhakov/', '/en-5-prompts-improved-ai-agent-workflow-claude-code/'],
  ['/21-question-ai-agent/', '/21-questions-ai-agent-knowledge-gaps/'],
]

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
  const pair = localizedPairs.find(([ru, en]) => ru === current || en === current)
  if (!pair) return null
  return {
    ru: pair[0],
    en: pair[1],
    'x-default': current,
  }
}
