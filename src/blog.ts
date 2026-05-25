export interface BlogArticle {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  readingTime: string
  tags: string[]
  youtube?: {
    title: string
    url: string
    thumbnail: string
    publishedAt: string
  }
}

export interface BlogListItem {
  path: string
  title: string
  description: string
  publishedAt: string
  readingTime: string
  tags: string[]
  thumbnail?: string
}

export const russianBlogItems: BlogListItem[] = [
  {
    path: '/claude-code-nastrojka-mcp-hooks-skills-2026/',
    title: 'Мой сетап Claude Code после 4 месяцев ежедневной работы',
    description: 'Telegram-derived лонгрид про MCP, hooks, skills, расходы и реальные куски Claude Code сетапа.',
    publishedAt: '2026-02-23',
    readingTime: '7 мин',
    tags: ['Claude Code', 'MCP', 'AI Agents'],
  },
  {
    path: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/',
    title: 'Второй мозг: личный AI-ассистент с Obsidian и Claude Code',
    description: 'Как превратить Obsidian vault в рабочий контекст для агента, а не в очередную папку с мёртвыми заметками.',
    publishedAt: '2026-01-23',
    readingTime: '1 мин',
    tags: ['Obsidian', 'Second Brain', 'Claude Code'],
  },
  {
    path: '/luchshie-skills-mcp-claude-code-agent-browser/',
    title: 'Лучшие скиллы и MCP для Claude Code',
    description: 'Agent Browser, Coolify MCP и другие расширения, которые реально помогают в агентном рабочем флоу.',
    publishedAt: '2026-01-31',
    readingTime: '4 мин',
    tags: ['Skills', 'MCP', 'Claude Code'],
  },
  {
    path: '/claude-code-compaction-kak-rabotaet/',
    title: 'Compaction в Claude Code: как работает сжатие контекста',
    description: 'Практическое объяснение, что происходит с контекстом агента и почему это важно для длинных задач.',
    publishedAt: '2026-03-31',
    readingTime: '4 мин',
    tags: ['Claude Code', 'Context', 'Agents'],
  },
  {
    path: '/claude-codex-dual-review/',
    title: 'Claude Code + Codex: двойное ревью AI-агентов',
    description: 'Как заставить двух агентов проверять планы друг друга и снижать риск слепых зон.',
    publishedAt: '2026-02-19',
    readingTime: '4 мин',
    tags: ['Codex', 'Claude Code', 'Review'],
  },
  {
    path: '/ai-agent-forum-telegram-chat-agenty/',
    title: 'Форум AI-агентов в Telegram-чате',
    description: 'Зачем нужен живой community loop вокруг AI-агентов и как из обсуждений доставать полезные инсайты.',
    publishedAt: '2026-01-23',
    readingTime: '3 мин',
    tags: ['Community', 'Telegram', 'AI Agents'],
  },
]

export const seoArticles: BlogArticle[] = [
  {
    slug: 'ai-tools-for-designers-design-engineering-agents',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    description: 'Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.',
    publishedAt: '2026-05-25',
    updatedAt: '2026-05-25',
    readingTime: '9 мин',
    tags: ['AI Agents', 'Design Engineering', 'Frontend'],
    youtube: {
      title: 'ИИ не вывозит норм дизайн или это skill issue? | Подкаст «Мой AI сетап»',
      url: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
      thumbnail: 'https://i.ytimg.com/vi/fIEMOzz0_AI/hqdefault.jpg',
      publishedAt: '2026-05-21',
    },
  },
]

export const russianArticleItems: BlogListItem[] = [
  ...seoArticles.map((article) => ({
    path: articlePath(article.slug),
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    tags: article.tags,
    thumbnail: article.youtube?.thumbnail,
  })),
  {
    path: '/articles/markdown-vs-html/',
    title: 'Markdown мёртв — да здравствует HTML',
    description: 'Почему HTML лучше подходит для длинных AI-agent артефактов, когда файлы пишет агент, а человек читает и шарит.',
    publishedAt: '2026-05-09',
    readingTime: '10 мин',
    tags: ['AI Agents', 'HTML', 'Claude Code'],
  },
]

export const englishArticleItems: BlogListItem[] = [
  {
    path: '/web-scraping-ai-agents-2026/',
    title: 'Web Scraping Is Dead: What AI Agents Replaced It With',
    description: 'A practical look at how browser agents changed scraping workflows, extraction and automation.',
    publishedAt: '2026-02-11',
    readingTime: '5 min',
    tags: ['Web Scraping', 'AI Agents', 'Browser Automation'],
  },
  {
    path: '/en-best-skills-mcp-claude-code-agent-browser/',
    title: 'Best Skills and MCP for Claude Code',
    description: 'Agent browser, useful MCP servers and practical Claude Code extensions worth testing.',
    publishedAt: '2026-02-20',
    readingTime: '4 min',
    tags: ['MCP', 'Skills', 'Claude Code'],
  },
  {
    path: '/claude-code-compaction-explained/',
    title: 'Claude Code Compaction: How Context Compression Works',
    description: 'A practical explainer on context compression, why long agent runs compact, and what breaks when context is lost.',
    publishedAt: '2026-02-10',
    readingTime: '4 min',
    tags: ['Claude Code', 'Context', 'Agents'],
  },
  {
    path: '/en-beads-gastown-framework-ai-agents/',
    title: 'Beads vs Gastown: Should You Use External Frameworks for AI Agents?',
    description: 'A framework comparison for managing AI-agent workflows without burying the actual task in process.',
    publishedAt: '2026-02-14',
    readingTime: '5 min',
    tags: ['AI Agents', 'Frameworks', 'Workflow'],
  },
]

export const englishBlogItems: BlogListItem[] = [
  {
    path: '/claude-code-setup-mcp-hooks-skills-2026/',
    title: 'My Claude Code Setup After 4 Months of Daily Use',
    description: 'MCP servers, hooks, skills, costs and the parts of Claude Code I actually use every day.',
    publishedAt: '2026-02-23',
    readingTime: '7 min',
    tags: ['Claude Code', 'AI Agents', 'Setup'],
  },
  {
    path: '/en-second-brain-obsidian-claude-code-assistant/',
    title: 'Second Brain: Obsidian and Claude Code Assistant',
    description: 'How to turn an Obsidian vault into useful working context for a personal AI assistant.',
    publishedAt: '2026-01-23',
    readingTime: '1 min',
    tags: ['Obsidian', 'Claude Code', 'Second Brain'],
  },
  {
    path: '/web-scraping-ai-agents-2026/',
    title: 'Web Scraping Is Dead: What AI Agents Replaced It With',
    description: 'A practical look at how browser agents changed scraping workflows, extraction and automation.',
    publishedAt: '2026-02-21',
    readingTime: '5 min',
    tags: ['Web Scraping', 'AI Agents', 'Browser Automation'],
  },
  {
    path: '/en-best-skills-mcp-claude-code-agent-browser/',
    title: 'Best Skills and MCP for Claude Code',
    description: 'Agent browser, useful MCP servers and practical Claude Code extensions worth testing.',
    publishedAt: '2026-02-20',
    readingTime: '4 min',
    tags: ['MCP', 'Skills', 'Claude Code'],
  },
  {
    path: '/en-show-me-ai-setup-ghostty-ownyourchat-descript/',
    title: 'Show Me Your AI Setup #1: Ghostty, ownyourchat, Descript',
    description: 'A practitioner tool review from the Show Me Your AI Setup series.',
    publishedAt: '2026-02-10',
    readingTime: '6 min',
    tags: ['AI Tools', 'Workflow', 'Review'],
  },
  {
    path: '/ai-tools-setup-january-2026/',
    title: 'My AI Dev Tools in 2026',
    description: 'The AI developer tools I actually use daily and where each one fits.',
    publishedAt: '2026-01-28',
    readingTime: '5 min',
    tags: ['AI Tools', 'Dev Setup', 'Codex'],
  },
]

export function blogPath(slug: string) {
  return `/blog/${slug}/`
}

export function articlePath(slug: string) {
  return `/articles/${slug}/`
}

export function getBlogArticle(slug: string | undefined) {
  return seoArticles.find((article) => article.slug === slug)
}
