import type { BlogListItem } from './blog'
import { russianArticleItems, russianBlogItems } from './blog'
import { importedArticleListItems } from './importedArticles'

export interface TopicDefinition {
  slug: string
  label: string
  title: string
  description: string
  aliases: string[]
  extraItems?: BlogListItem[]
}

export const topicDefinitions: TopicDefinition[] = [
  {
    slug: 'ai-agents',
    label: 'AI-агенты',
    title: 'AI-агенты',
    description: 'Практические материалы про агентные флоу, Claude Code, Codex, skills, ревью и рабочий контекст.',
    aliases: ['ai agents', 'agents', 'ai coding'],
  },
  {
    slug: 'claude-code',
    label: 'Claude Code',
    title: 'Claude Code',
    description: 'Сетап, skills, MCP, compaction, workflow и реальные ограничения Claude Code.',
    aliases: ['claude code', 'skills'],
    extraItems: importedArticleListItems([
      '/claude-code-nastrojka-mcp-hooks-skills-2026/',
      '/vtoroj-mozg-ai-assistent-obsidian-claude-code/',
    ]),
  },
  {
    slug: 'codex',
    label: 'Codex',
    title: 'Codex',
    description: 'Переходы между Codex и Claude Code, review loops, desktop app и context hygiene.',
    aliases: ['codex', 'review'],
    extraItems: importedArticleListItems(['/claude-codex-dual-review/']),
  },
  {
    slug: 'mcp',
    label: 'MCP',
    title: 'MCP',
    description: 'MCP-серверы, agent-browser, Telegram/Coolify интеграции и практическое расширение агентных инструментов.',
    aliases: ['mcp'],
    extraItems: importedArticleListItems(['/luchshie-skills-mcp-claude-code-agent-browser/']),
  },
  {
    slug: 'gstack',
    label: 'GStack',
    title: 'GStack',
    description: 'GStack, office-hours, goal loops и HTML-progress как рабочий цикл для AI-агента.',
    aliases: ['gstack'],
  },
  {
    slug: 'gbrain',
    label: 'GBrain',
    title: 'GBrain',
    description: 'GBrain/OpenBrain, retrieval layer, shared context and memory for agents.',
    aliases: ['gbrain'],
  },
  {
    slug: 'ai-coding',
    label: 'AI Coding',
    title: 'AI coding',
    description: 'Практика coding agents: specs, plan mode, review, context hygiene и переносимость флоу.',
    aliases: ['ai coding'],
  },
  {
    slug: 'ai-transformation',
    label: 'AI Transformation',
    title: 'AI-трансформация',
    description: 'Как компании превращают AI-доступы, skills и общий контекст в рабочую систему.',
    aliases: ['ai transformation'],
  },
  {
    slug: 'refactoring',
    label: 'Refactoring',
    title: 'Рефакторинг',
    description: 'Архитектурные ревью, improve-codebase-architecture и аккуратная докрутка вайбкода.',
    aliases: ['refactoring'],
  },
  {
    slug: 'ai-tools',
    label: 'AI Tools',
    title: 'AI-инструменты',
    description: 'Инструменты для агентного рабочего флоу: что пробовать, что выкидывать, где реальная польза.',
    aliases: ['ai tools', 'dev setup'],
  },
  {
    slug: 'design-engineering',
    label: 'Design Engineering',
    title: 'Design engineering',
    description: 'AI-assisted frontend, Figma-to-code, design tokens, taste и борьба с AI-slop.',
    aliases: ['design engineering', 'frontend'],
  },
  {
    slug: 'html',
    label: 'HTML',
    title: 'HTML',
    description: 'HTML как формат для AI-agent артефактов, статей, компонентов и LLM-readable страниц.',
    aliases: ['html'],
  },
  {
    slug: 'second-brain',
    label: 'Second Brain',
    title: 'Second Brain',
    description: 'Obsidian, markdown vaults, wiki-ссылки, raw notes и персональный рабочий контекст для агентов.',
    aliases: ['second brain', 'obsidian'],
  },
  {
    slug: 'web-scraping',
    label: 'Web Scraping',
    title: 'Web scraping',
    description: 'Browser automation, agent-browser и новые способы доставать данные из сайтов.',
    aliases: ['web scraping', 'browser automation'],
  },
  {
    slug: 'frameworks',
    label: 'Frameworks',
    title: 'Фреймворки для агентов',
    description: 'Beads, Gastown, first-party tools and the cost of adopting someone else’s agent framework.',
    aliases: ['frameworks'],
  },
  {
    slug: 'workflow',
    label: 'Workflow',
    title: 'Workflow',
    description: 'Agent workflows: setup, context, review loops, progress artifacts and daily usage.',
    aliases: ['workflow', 'setup', 'context', 'review'],
  },
  {
    slug: 'community',
    label: 'Community',
    title: 'Community',
    description: 'Telegram-чаты, обсуждения, community insights and the feedback loop around AI-agent content.',
    aliases: ['community'],
  },
  {
    slug: 'openclaw',
    label: 'OpenClaw',
    title: 'OpenClaw',
    description: 'Заготовка под OpenClaw hub: practical setup, Codex/Hermes сравнения и skills flow.',
    aliases: ['openclaw'],
  },
  {
    slug: 'ton-data',
    label: 'TON-данные',
    title: 'TON-данные',
    description: 'On-chain analytics, TON research, Dune, EVAA, USDT и AI-ассистенты для анализа данных.',
    aliases: ['ton', 'data', 'analytics'],
    extraItems: importedArticleListItems([
      '/ton-analyst-ai-skill-ton-blockchain-dune/',
      '/evaa-strategies-onchain-research/',
    ]),
  },
  {
    slug: 'telegram-automation',
    label: 'Telegram',
    title: 'Telegram-автоматизация',
    description: 'Telegram bots, Mini Apps, voice workflows, AI-агенты в чатах и автоматизация через Telegram.',
    aliases: ['telegram', 'community'],
    extraItems: importedArticleListItems([
      '/telegram-mini-app-llms-txt-claude-code-stream/',
      '/ai-agent-forum-telegram-chat-agenty/',
    ]),
  },
]

const homeTopicSlugs = ['ai-agents', 'claude-code', 'codex', 'mcp', 'gstack', 'openclaw', 'ton-data', 'telegram-automation']
export const homeTopics = topicDefinitions.filter((topic) => homeTopicSlugs.includes(topic.slug))

export function topicPath(slug: string) {
  return `/topics/${slug}/`
}

export function slugifyTopicTag(tag: string) {
  const normalized = tag.trim().toLowerCase()
  return topicDefinitions.find((topic) => topic.aliases.includes(normalized) || topic.label.toLowerCase() === normalized)?.slug
    || normalized
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
}

function itemMatchesTopic(item: BlogListItem, topic: TopicDefinition) {
  const haystack = [
    item.title,
    item.description,
    ...item.tags,
  ].join(' ').toLowerCase()
  return topic.aliases.some((alias) => haystack.includes(alias.toLowerCase()))
}

export function getTopic(slug: string | undefined) {
  return topicDefinitions.find((topic) => topic.slug === slug)
}

export function getTopicItems(slug: string | undefined) {
  const topic = getTopic(slug)
  if (!topic) return []
  const seen = new Set<string>()
  const items = [...russianBlogItems, ...russianArticleItems, ...(topic.extraItems || [])]
    .filter((item) => itemMatchesTopic(item, topic) || topic.extraItems?.some((extra) => extra.path === item.path))
    .filter((item) => {
      if (seen.has(item.path)) return false
      seen.add(item.path)
      return true
    })
  return items
}
