/**
 * Lightweight prerender for SPA on GitHub Pages.
 *
 * For each known route, writes:
 *  - dist/<route>/index.html with route-specific <title>, meta, og, canonical,
 *    optional type-specific schema.org JSON-LD, and a static HTML body fallback
 *    inside #root (replaced by React's createRoot on mount; visible to crawlers
 *    and noJS clients).
 *  - dist/<slug>.md — plain Markdown version of the page for LLM crawlers
 *    (referenced from /llms.txt). Static-hosting equivalent of the
 *    "Markdown for Agents" Accept-negotiation pattern.
 */
import fs from 'node:fs'
import path from 'node:path'

const dist = 'dist'
const DEFAULT_SITE_URL = 'https://okhlopkov.com'
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const STATIC_UPDATED_DATE = '2026-05-25'
const STATIC_UPDATED_AT = `${STATIC_UPDATED_DATE}T00:00:00+03:00`
const BLOG_POSTS_DIR = path.join('content', 'blog-posts')
const IMPORTED_ARTICLES_INDEX = path.join('content', 'articles', 'imported-index.json')
const IMPORTED_ARTICLES_CONTENT = path.join('content', 'articles', 'imported-content.json')
const LOCALIZED_GROUPS_PATH = path.join('content', 'articles', 'localized-groups.json')

const NAV_LINKS = [
  ['/', 'Главная'],
  ['/blog/', 'Блог'],
  ['/articles/', 'Статьи'],
  ['/about/', 'Обо мне'],
  ['/en/', 'English'],
  ['/privacy/', 'Privacy'],
]

const SOCIAL_LINKS = [
  ['https://t.me/danokhlopkov', 'Telegram'],
  ['https://youtube.com/@danokhlopkov', 'YouTube'],
  ['https://instagram.com/d7733o', 'Instagram'],
  ['https://x.com/danokhlopkov', 'X'],
  ['https://www.linkedin.com/in/danokhlopkov/', 'LinkedIn'],
  ['https://github.com/ohld', 'GitHub'],
]

const ARTICLE_LANGS = ['ru', 'en', 'zh']
const LOCALIZED_GROUPS = JSON.parse(fs.readFileSync(LOCALIZED_GROUPS_PATH, 'utf8'))

function canonicalPathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function normalizeImportedArticleHtml(html = '') {
  return html
    .replace(
      /<a\b[^>]*\bhref=(["'])\/cdn-cgi\/l\/email-protection(?:#[^"']*)?\1[^>]*>[\s\S]*?<\/a>/gi,
      'DOKKU_LETSENCRYPT_EMAIL=you@example.com',
    )
    .replace(
      /\bhref=(["'])(?![a-z][a-z0-9+.-]*:|[/?#]|mailto:|tel:)([^"'\s>]+?\.[a-z]{2,}(?:[/?#][^"']*)?)\1/gi,
      (_match, quote, href) => `href=${quote}https://${href}${quote}`,
    )
}

function textFromHtml(value = '') {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function ensureImageAlt(imgTag, fallbackAlt) {
  const alt = (fallbackAlt || 'Daniil Okhlopkov article image').trim().slice(0, 160)
  const altMatch = imgTag.match(/\s+alt(?:=(["'])(.*?)\1|=([^\s"'=<>`]+))?/i)
  const currentAlt = altMatch?.[2] || altMatch?.[3] || ''
  if (altMatch && currentAlt.trim()) return imgTag
  if (altMatch) return imgTag.replace(altMatch[0], ` alt="${escape(alt)}"`)
  return imgTag.replace(/\s*\/?>$/, (suffix) => ` alt="${escape(alt)}"${suffix.includes('/') ? ' />' : '>'}`)
}

function addMissingImageAlts(html = '', fallbackAlt = '') {
  return html
    .replace(/<figure\b[\s\S]*?<\/figure>/gi, (figure) => {
      const caption = textFromHtml(figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || '')
      return figure.replace(/<img\b[^>]*>/gi, (img) => ensureImageAlt(img, caption || fallbackAlt))
    })
    .replace(/<img\b[^>]*>/gi, (img) => ensureImageAlt(img, fallbackAlt))
}

function importedArticleAlternates(pathname, lang) {
  const current = canonicalPathname(pathname)
  const group = LOCALIZED_GROUPS.find((item) => ARTICLE_LANGS.some((articleLang) => item[articleLang] === current))
  if (!group) {
    return {
      [lang]: `${SITE_URL}${current}`,
      'x-default': `${SITE_URL}${current}`,
    }
  }

  const alternates = {}
  for (const articleLang of ARTICLE_LANGS) {
    if (group[articleLang]) alternates[articleLang] = `${SITE_URL}${group[articleLang]}`
  }
  const fallbackLang = group.xDefault || ARTICLE_LANGS.find((articleLang) => group[articleLang])
  alternates['x-default'] = `${SITE_URL}${group[fallbackLang]}`
  return alternates
}

const HOME_FALLBACK_MD = `# Даниил Охлопков

> Практика [AI-агентов](/topics/ai-agents/): [Codex](/topics/codex/), [Claude Code](/topics/claude-code/), [MCP](/topics/mcp/), [GStack](/topics/gstack/), [OpenClaw](/topics/openclaw/), [TON-данные](/topics/ton-data/) и [Telegram-автоматизация](/topics/telegram-automation/).

## Разделы

- [Блог](/blog/) — записи и рабочие заметки.
  - [AI-трансформация в компании: общий контекст, skills и GBrain](/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/)
  - [GStack, /goal и office hours: рабочий цикл для AI-агента](/blog/gstack-goal-office-hours-ai-workflow/)
  - [Claude Code vs Codex: почему я на две недели перешёл на Codex](/blog/claude-code-vs-codex-perehod/)
- [Статьи](/articles/) — гайды, сравнения, туториалы и материалы из собранных источников.
  - [AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code](/articles/ai-tools-for-designers-design-engineering-agents/)
  - [Markdown мёртв — да здравствует HTML](/articles/markdown-vs-html/)
- [Обо мне](/about/) — бэкграунд, опыт и ссылки.

## Если вы настраиваете AI-агентов

Начните с [моего Claude Code setup](/claude-code-nastrojka-mcp-hooks-skills-2026/):
там собраны MCP-серверы, hooks, skills, subagents и правила, которые пережили
несколько месяцев ежедневной работы. Если агент начинает забывать контекст,
откройте разбор [Claude Code compaction](/claude-code-compaction-kak-rabotaet/).
Если нужно понять, когда брать Codex, а когда Claude Code, смотрите
[переход на Codex](/blog/claude-code-vs-codex-perehod/).

Рабочая схема простая: \`AGENTS.md\` или \`CLAUDE.md\` держит постоянные правила
проекта, skills хранят повторяемые процедуры, MCP подключает живые данные и
внешние инструменты, hooks ловят опасные действия, subagents выносят ресёрч и
ревью в отдельный контекст. Всё остальное обычно превращается в длинный промпт,
который агент всё равно забудет.

## Практические входы

- [Web scraping AI agents](/web-scraping-ai-agents-2026/) — когда браузерный агент лучше старого парсера.
- [Second brain + Obsidian](/vtoroj-mozg-ai-assistent-obsidian-claude-code/) — как хранить сырьё, решения и память проекта.
- [Skills и MCP для Claude Code](/luchshie-skills-mcp-claude-code-agent-browser/) — что ставить, а что не усложнять.
- [AI-инструменты для дизайнеров](/articles/ai-tools-for-designers-design-engineering-agents/) — design engineering без generic UI-slop.
- [GStack, goal и office hours](/blog/gstack-goal-office-hours-ai-workflow/) — как вести длинную agent-задачу до результата.

## Карта терминов без маркетинга

- **Project rules** — инварианты репозитория: стиль, запреты, команды проверки, где лежат данные.
- **Skills** — короткие воспроизводимые процедуры: audit, ship, review, scrape, deploy.
- **MCP** — доступ к живым системам: браузер, GBrain, GitHub, аналитика, документы, внешние API.
- **Hooks** — автоматические стопперы перед опасными командами, секретами и случайным деплоем.
- **Subagents** — отдельный контекст для ресёрча, QA и независимого ревью, чтобы не засорять основную задачу.

## Как я понимаю, что статья зашла

Один просмотр почти ничего не значит. Нормальный сигнал появляется, когда
поисковый запрос, поведение на странице и следующее действие складываются в одну
картину. Поэтому для статей я смотрю не только трафик, но и глубину чтения,
клики по внутренним ссылкам, копирование кода, переходы к инструментам и
возвраты к связанным материалам.

- Есть показы, но слабый CTR — переписать title, description и первый экран.
- Есть клики, но нет глубины чтения — убрать длинный заход и поднять примеры выше.
- Читают до конца, но не переходят дальше — добавить cluster links и понятный следующий шаг.
- Копируют код или открывают внешние инструменты — тему стоит расширять отдельной статьёй.

## Мини-план после SEO-аудита

- Alt у картинок должен описывать изображение или брать смысл из подписи, а не набивать ключи.
- Mobile-first — это одинаковый контент, читаемый шрифт и tap targets около 44px.
- INP лечится не магией, а меньшим JavaScript на старте и отложенной загрузкой тяжёлых страниц.
- 500+ слов имеют смысл только если это чеклист, примеры, ссылки и ответы на реальные запросы.
- Off-page флаги не чинятся HTML-ом: нужны dofollow mentions, профили, партнёрства и нормальные кейсы.

## Мой чеклист перед тем, как доверять агенту

- Дать агенту реальные файлы проекта, а не пересказ архитектуры.
- Разделить задачу: ресёрч отдельно, правки отдельно, ревью отдельно.
- Запустить build, typecheck, smoke-тест и mobile viewport до деплоя.
- Проверить, что агент не трогал чужие изменения и не унёс секреты.
- Сохранить выводы в GBrain/Obsidian, если это повторится в будущем.

На этом сайте я собираю именно такие рабочие паттерны: не “AI сделает всё”, а
где агент реально ускоряет разработку, аналитику, SEO, Telegram-автоматизацию и
работу с on-chain данными.
`

const EN_HOME_FALLBACK_MD = `# Daniil Okhlopkov

> Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation.

## Sections

- [Blog](/en/blog/) — notes and working ideas.
- [Articles](/en/articles/) — tutorials, comparisons and explainers.
- [About](/en/about/) — background, work and links.

## If you are setting up AI agents

Start with [my Claude Code setup](/claude-code-setup-mcp-hooks-skills-2026/):
MCP servers, hooks, skills, subagents and project rules that survived months of
daily work. If the agent starts losing context, read the
[Claude Code compaction notes](/claude-code-compaction-kak-rabotaet/). If you
need to choose between Codex and Claude Code, use the
[Codex migration write-up](/blog/claude-code-vs-codex-perehod/).

The working split is simple: \`AGENTS.md\` or \`CLAUDE.md\` stores project
invariants, skills store repeatable procedures, MCP connects live data and
tools, hooks catch risky actions, and subagents isolate research or review from
the main editing context.

## Practical entry points

- [Web scraping AI agents](/web-scraping-ai-agents-2026/) — when a browser agent beats an old parser.
- [Second brain + Obsidian](/vtoroj-mozg-ai-assistent-obsidian-claude-code/) — how to store raw notes, decisions and project memory.
- [Claude Code skills and MCP](/luchshie-skills-mcp-claude-code-agent-browser/) — what to install, and what not to over-engineer.
- [AI tools for designers](/articles/ai-tools-for-designers-design-engineering-agents/) — design engineering without generic UI-slop.
- [GStack, goal and office hours](/blog/gstack-goal-office-hours-ai-workflow/) — how to keep a long agent task moving until it ships.

## Agent terms without marketing

- **Project rules** — repository invariants: style, safety limits, validation commands and data locations.
- **Skills** — repeatable procedures such as audit, ship, review, scrape and deploy.
- **MCP** — live tool access: browser, GBrain, GitHub, analytics, documents and external APIs.
- **Hooks** — automatic checks before risky commands, leaked secrets or accidental deploys.
- **Subagents** — isolated context for research, QA and independent review.

## How I decide whether an article worked

A pageview is too weak as a signal. A useful article usually has a matching
search query, visible reading depth and a clear next action. For articles I look
at search impressions, CTR, scroll depth, internal clicks, copied code, outbound
tool links and returns to related pages.

- Impressions with weak CTR — rewrite title, description and the first screen.
- Clicks without reading depth — shorten the intro and move examples higher.
- Full reads without internal clicks — add cluster links and a clearer next step.
- Copied code or tool clicks — the topic probably deserves a follow-up article.

## Mini-plan after an SEO audit

- Image alt text should describe the image or reuse the caption, not stuff keywords.
- Mobile-first means equivalent content, readable type and tap targets around 44px.
- INP improves when less JavaScript runs at startup and heavy pages load later.
- 500+ words only help when they are checklists, examples, links and real answers.
- Off-page flags need dofollow mentions, profiles, partnerships and useful case studies.

## My checklist before trusting an agent

- Give the agent real project files, not a hand-written architecture summary.
- Separate the task: research first, edits second, review after the diff exists.
- Run build, typecheck, smoke tests and mobile viewport checks before deploy.
- Check that the agent did not touch unrelated changes or expose credentials.
- Save durable lessons to GBrain or Obsidian when the pattern will repeat.

This site is where I collect those patterns: not “AI will do everything”, but
where agents actually speed up engineering, analytics, SEO, Telegram automation
and on-chain data work.
`

function parseFrontmatter(raw, filename = 'markdown file') {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`${filename}: missing frontmatter`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return { meta, body: match[2].trim() }
}

function splitList(value = '', separator = ',') {
  return value.split(separator).map((item) => item.trim()).filter(Boolean)
}

function loadGeneratedBlogPosts() {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return []
  return fs.readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const fullPath = path.join(BLOG_POSTS_DIR, file)
      const { meta, body } = parseFrontmatter(fs.readFileSync(fullPath, 'utf8'), fullPath)
      return {
        ...meta,
        tags: splitList(meta.tags || ''),
        secondaryKeywords: splitList(meta.secondaryKeywords || '', ';'),
        body,
      }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

const GENERATED_BLOG_POSTS = loadGeneratedBlogPosts()

function loadImportedArticleRows() {
  if (!fs.existsSync(IMPORTED_ARTICLES_INDEX) || !fs.existsSync(IMPORTED_ARTICLES_CONTENT)) return []
  const index = JSON.parse(fs.readFileSync(IMPORTED_ARTICLES_INDEX, 'utf8'))
  const content = JSON.parse(fs.readFileSync(IMPORTED_ARTICLES_CONTENT, 'utf8'))
  const bodyByPath = new Map(content.map((article) => [article.path, normalizeImportedArticleHtml(article.bodyHtml || '')]))
  return index.map((article) => ({
    ...article,
    bodyHtml: addMissingImageAlts(bodyByPath.get(article.path) || '', article.title || article.description || 'Daniil Okhlopkov article image'),
  }))
}

const IMPORTED_ARTICLES = loadImportedArticleRows()

const TOPIC_PAGES = [
  ['ai-agents', 'AI-агенты', 'Практические материалы про агентные флоу, Claude Code, Codex, skills, ревью и рабочий контекст.'],
  ['claude-code', 'Claude Code', 'Сетап, skills, MCP, compaction, workflow и реальные ограничения Claude Code.'],
  ['codex', 'Codex', 'Переходы между Codex и Claude Code, review loops, desktop app и context hygiene.'],
  ['mcp', 'MCP', 'MCP-серверы, agent-browser, Telegram/Coolify интеграции и практическое расширение агентных инструментов.'],
  ['gstack', 'GStack', 'GStack, office-hours, goal loops и HTML-progress как рабочий цикл для AI-агента.'],
  ['gbrain', 'GBrain', 'GBrain/OpenBrain, retrieval layer, shared context and memory for agents.'],
  ['ai-coding', 'AI coding', 'Практика coding agents: specs, plan mode, review, context hygiene и переносимость флоу.'],
  ['ai-transformation', 'AI-трансформация', 'Как компании превращают AI-доступы, skills и общий контекст в рабочую систему.'],
  ['refactoring', 'Рефакторинг', 'Архитектурные ревью, improve-codebase-architecture и аккуратная докрутка вайбкода.'],
  ['ai-tools', 'AI-инструменты', 'Инструменты для агентного рабочего флоу: что пробовать, что выкидывать, где реальная польза.'],
  ['design-engineering', 'Design engineering', 'AI-assisted frontend, Figma-to-code, design tokens, taste и борьба с AI-slop.'],
  ['html', 'HTML', 'HTML как формат для AI-agent артефактов, статей, компонентов и LLM-readable страниц.'],
  ['second-brain', 'Second Brain', 'Obsidian, markdown vaults, wiki-ссылки, raw notes и персональный рабочий контекст для агентов.'],
  ['web-scraping', 'Web scraping', 'Browser automation, agent-browser и новые способы доставать данные из сайтов.'],
  ['frameworks', 'Фреймворки для агентов', 'Beads, Gastown, first-party tools and the cost of adopting someone else’s agent framework.'],
  ['workflow', 'Workflow', 'Agent workflows: setup, context, review loops, progress artifacts and daily usage.'],
  ['community', 'Community', 'Telegram-чаты, обсуждения, community insights and the feedback loop around AI-agent content.'],
  ['openclaw', 'OpenClaw', 'Заготовка под OpenClaw hub: practical setup, Codex/Hermes сравнения и skills flow.'],
  ['ton-data', 'TON-данные', 'On-chain analytics, TON research, Dune, EVAA, USDT и AI-ассистенты для анализа данных.'],
  ['telegram-automation', 'Telegram-автоматизация', 'Telegram bots, Mini Apps, voice workflows, AI-агенты в чатах и автоматизация через Telegram.'],
]

function topicMarkdown(title, description) {
  return `${description}

## Материалы

- [Блог](/blog/) — записи и рабочие заметки.
- [Статьи](/articles/) — гайды, сравнения и туториалы.
- [AI-агенты: с чего начать в 2026](/blog/ai-agents-s-chego-nachat/)
- [GStack, /goal и office hours](/blog/gstack-goal-office-hours-ai-workflow/)
- [Claude Code vs Codex](/blog/claude-code-vs-codex-perehod/)
- [AI-инструменты для дизайнеров](/articles/ai-tools-for-designers-design-engineering-agents/)

## Смежные темы

[AI-агенты](/topics/ai-agents/) · [Claude Code](/topics/claude-code/) · [Codex](/topics/codex/) · [MCP](/topics/mcp/) · [GStack](/topics/gstack/) · [OpenClaw](/topics/openclaw/) · [TON-данные](/topics/ton-data/) · [Telegram](/topics/telegram-automation/)
`
}

const ROUTES = [
  {
    path: '/en',
    slug: 'en',
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/`,
      en: `${SITE_URL}/en/`,
      'x-default': `${SITE_URL}/`,
    },
    markdown: EN_HOME_FALLBACK_MD,
  },
  {
    path: '/en/about',
    slug: 'en-about',
    title: 'About — Daniil Okhlopkov',
    description: 'Daniil Okhlopkov: Analytics Team Lead at TON Foundation, former CTO and data scientist. AI agents, on-chain analytics and Telegram workflows.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/about/`,
      en: `${SITE_URL}/en/about/`,
      'x-default': `${SITE_URL}/about/`,
    },
  },
  {
    path: '/about',
    slug: 'about',
    title: 'Обо мне — Даниил Охлопков',
    description: 'Даниил Охлопков — Head of Analytics @ TON Foundation. Опыт: InstaBot, Shazam-ботсети 13.7M юзеров, Forbes 30 under 30 (2022).',
    alternates: {
      ru: `${SITE_URL}/about/`,
      en: `${SITE_URL}/en/about/`,
      'x-default': `${SITE_URL}/about/`,
    },
  },
  {
    path: '/en/blog',
    slug: 'en-blog',
    title: 'Blog — Daniil Okhlopkov',
    description: 'English blog posts and preserved notes by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP, data and Telegram.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/blog/`,
    },
  },
  {
    path: '/blog',
    slug: 'blog',
    title: 'Блог — Даниил Охлопков',
    description: 'Блог Даниила Охлопкова: записи и рабочие заметки про AI-агентов, Claude Code, Codex, MCP и рабочие флоу.',
    alternates: {
      ru: `${SITE_URL}/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/blog/`,
    },
  },
  {
    path: '/en/articles',
    slug: 'en-articles',
    title: 'Articles — Daniil Okhlopkov',
    description: 'English tutorials and evergreen explainers by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP and automation.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/articles/`,
    },
  },
  {
    path: '/articles',
    slug: 'articles',
    title: 'Статьи — Даниил Охлопков',
    description: 'Туториалы, сравнения AI-инструментов и плотные разборы Даниила Охлопкова: OpenClaw, Claude Code, Codex, Cursor, MCP и agent workflows.',
    alternates: {
      ru: `${SITE_URL}/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/articles/`,
    },
  },
  {
    path: '/articles/ai-tools-for-designers-design-engineering-agents',
    slug: 'articles-ai-tools-for-designers-design-engineering-agents',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    description: 'Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.',
    publishedAt: '2026-05-25',
    updatedAt: '2026-05-25',
    tags: ['AI Agents', 'Design Engineering', 'Frontend'],
    section: 'Статьи',
    image: 'https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg',
  },
  {
    path: '/private-channel',
    slug: 'private-channel',
    title: 'Закрытый канал — Даниил Охлопков',
    description: 'Даниил Охлопков — закрытое сообщество AI / web3 / TG+TON фаундеров и билдеров. Живые мысли без AI-слопа.',
    robots: 'noindex, follow',
  },
  {
    path: '/articles/markdown-vs-html',
    slug: 'markdown-vs-html',
    title: 'Markdown мёртв — да здравствует HTML | Даниил Охлопков',
    description: 'Даниил Охлопков — почему HTML побеждает markdown как формат вывода для AI-агентов. Плотность инфы, читаемость, шеринг, интерактив. С примерами промптов и реальными кейсами.',
    publishedAt: '2026-05-09',
    updatedAt: '2026-05-10',
    tags: ['AI Agents', 'HTML', 'Claude Code'],
    section: 'Статьи',
  },
  {
    path: '/privacy',
    slug: 'privacy',
    title: 'Privacy Policy — okhlopkov.com',
    description: 'Privacy policy for okhlopkov.com and the personal Pinterest Content Ideas integration.',
    lang: 'en',
    alternates: {
      en: `${SITE_URL}/privacy/`,
      'x-default': `${SITE_URL}/privacy/`,
    },
  },
]

for (const post of GENERATED_BLOG_POSTS) {
  ROUTES.push({
    path: `/blog/${post.slug}`,
    slug: `blog-${post.slug}`,
    title: post.title,
    description: post.description,
    lang: 'ru',
    alternates: {
      ru: `${SITE_URL}/blog/${post.slug}/`,
      'x-default': `${SITE_URL}/blog/${post.slug}/`,
    },
    kind: 'generated-blog-post',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    sourceTelegramId: post.sourceTelegramId,
    primaryKeyword: post.primaryKeyword,
    secondaryKeywords: post.secondaryKeywords,
    tags: post.tags,
    views: post.views,
    forwards: post.forwards,
    comments: post.comments,
    reactions: post.reactions,
    heroImage: post.coverImage,
    image: absoluteImageUrl(post.coverImage) || 'https://github.com/ohld.png',
    markdown: post.body,
  })
}

for (const [slug, title, description] of TOPIC_PAGES) {
  ROUTES.push({
    path: `/topics/${slug}`,
    slug: `topic-${slug}`,
    title: `${title} — Даниил Охлопков`,
    description,
    lang: 'ru',
    alternates: {
      ru: `${SITE_URL}/topics/${slug}/`,
      'x-default': `${SITE_URL}/topics/${slug}/`,
    },
    kind: 'topic-page',
    topicTitle: title,
    markdown: topicMarkdown(title, description),
  })
}

for (const article of IMPORTED_ARTICLES) {
  if (!article.path || !article.bodyHtml) continue
  const canonical = canonicalPathname(article.path)
  const routePath = canonical === '/' ? '/' : canonical.slice(0, -1)
  const slug = `article-${canonical.replace(/^\/|\/$/g, '').replace(/\//g, '-')}`
  ROUTES.push({
    path: routePath,
    slug,
    title: article.title || 'Daniil Okhlopkov',
    description: article.description || '',
    lang: article.lang || 'ru',
    kind: 'article-page',
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt || STATIC_UPDATED_DATE,
    markdown: articleMarkdown(article, article.bodyHtml),
    bodyHtml: article.bodyHtml,
    heroImage: article.heroImage,
    image: absoluteImageUrl(article.heroImage) || 'https://github.com/ohld.png',
    alternates: importedArticleAlternates(canonical, article.lang || 'ru'),
  })
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function applySiteUrl(html) {
  return html.replaceAll(DEFAULT_SITE_URL, SITE_URL)
}

function stripTags(html = '') {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function markdownToText(markdown = '') {
  return stripTags(mdToHtml(markdown))
}

function jsonForHtml(data) {
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
}

function absoluteImageUrl(url = '') {
  if (!url) return ''
  return url.startsWith('/') ? `${SITE_URL}${url}` : url
}

const AUTHOR_SCHEMA = {
  '@type': 'Person',
  name: 'Даниил Охлопков',
  alternateName: 'Daniil Okhlopkov',
  url: `${SITE_URL}/`,
}

function isArticleRoute(route) {
  return route.kind === 'generated-blog-post'
    || route.kind === 'article-page'
    || route.slug === 'markdown-vs-html'
    || route.slug === 'articles-ai-tools-for-designers-design-engineering-agents'
}

function routeArticleText(route) {
  if (route.bodyHtml) return stripTags(route.bodyHtml)
  if (route.markdown) return markdownToText(route.markdown)
  const markdown = getRouteMd(route)
  return markdown ? markdownToText(markdown) : ''
}

function articleSchema(route, overrides = {}) {
  const pageUrl = `${SITE_URL}${route.path}/`
  const articleUrl = `${pageUrl}#article-content`
  const tags = (route.tags || overrides.tags || []).filter(Boolean)
  const text = routeArticleText(route)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': articleUrl,
    headline: route.title,
    description: route.description,
    datePublished: route.publishedAt || overrides.datePublished,
    dateModified: route.updatedAt || overrides.dateModified || route.publishedAt || STATIC_UPDATED_AT,
    author: AUTHOR_SCHEMA,
    publisher: AUTHOR_SCHEMA,
    image: [route.image || absoluteImageUrl(route.heroImage) || overrides.image || 'https://github.com/ohld.png'],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    url: articleUrl,
    inLanguage: route.lang || 'ru',
    keywords: tags,
    articleSection: route.section || overrides.section,
    about: tags.map((name) => ({ '@type': 'Thing', name })),
    text,
    articleBody: text,
    ...overrides,
  }
  for (const [key, value] of Object.entries(schema)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete schema[key]
    }
  }
  return schema
}

// Inline regex md→html: only what our templates use (headings, lists,
// blockquotes, links, tables and fenced code/prompt blocks).
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  const listStack = []
  let inQuote = false
  let para = []
  let inCode = false
  let codeLines = []
  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inlineFmt(para.join(' '))}</p>`)
    para = []
  }
  const closeListLevel = () => {
    const current = listStack.pop()
    if (!current) return
    if (current.openLi) out.push('</li>')
    out.push(`</${current.tag}>`)
  }
  const closeList = () => {
    while (listStack.length) closeListLevel()
  }
  const writeListItem = (tag, indent, content) => {
    while (listStack.length && indent < listStack[listStack.length - 1].indent) {
      closeListLevel()
    }
    let current = listStack[listStack.length - 1]
    if (current && indent === current.indent && current.tag !== tag) {
      closeListLevel()
      current = listStack[listStack.length - 1]
    }
    if (!current || indent > current.indent || current.tag !== tag) {
      if (current && current.openLi && indent <= current.indent) {
        out.push('</li>')
        current.openLi = false
      }
      out.push(`<${tag}>`)
      listStack.push({ tag, indent, openLi: false })
    } else if (current.openLi) {
      out.push('</li>')
      current.openLi = false
    }
    const active = listStack[listStack.length - 1]
    out.push(`<li>${inlineFmt(content)}`)
    active.openLi = true
  }
  const closeQuote = () => { if (inQuote) { out.push('</blockquote>'); inQuote = false } }
  const flushCode = () => {
    if (!inCode) return
    out.push(`<pre><code>${escapeCode(codeLines.join('\n'))}</code></pre>`)
    codeLines = []
    inCode = false
  }
  const escapeCode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inlineFmt = (s) => {
    let t = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${url.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => `<a href="${url.replace(/"/g, '&quot;')}">${txt}</a>`)
    return t
  }
  const isTableDivider = (line) => /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)
  const splitTableRow = (line) => line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index]
    const line = raw.trimEnd()
    if (inCode) {
      if (line.startsWith('```')) { flushCode(); continue }
      codeLines.push(raw)
      continue
    }
    if (line.startsWith('```')) { flushPara(); closeList(); closeQuote(); inCode = true; codeLines = []; continue }
    if (!line.trim()) { flushPara(); closeList(); closeQuote(); continue }
    if (line.trim() === '>') { flushPara(); closeList(); closeQuote(); continue }
    if (line.startsWith('|') && lines[index + 1]?.trimEnd().startsWith('|') && isTableDivider(lines[index + 1].trimEnd())) {
      flushPara(); closeList(); closeQuote()
      const headers = splitTableRow(line)
      index += 2
      const bodyRows = []
      while (index < lines.length && lines[index].trimEnd().startsWith('|')) {
        bodyRows.push(splitTableRow(lines[index].trimEnd()))
        index += 1
      }
      index -= 1
      out.push(`<table><thead><tr>${headers.map((cell) => `<th>${inlineFmt(cell)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${inlineFmt(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      continue
    }
    if (line.startsWith('### ')) { flushPara(); closeList(); closeQuote(); out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`); continue }
    if (line.startsWith('## ')) { flushPara(); closeList(); closeQuote(); out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`); continue }
    if (line.startsWith('# ')) { flushPara(); closeList(); closeQuote(); out.push(`<h1>${inlineFmt(line.slice(2))}</h1>`); continue }
    const unordered = raw.match(/^(\s*)([-*•▪])\s+(.+)$/)
    if (unordered) { flushPara(); closeQuote(); writeListItem('ul', unordered[1].replace(/\t/g, '  ').length, unordered[3]); continue }
    const ordered = raw.match(/^(\s*)\d+[.)]\s+(.+)$/)
    if (ordered) { flushPara(); closeQuote(); writeListItem('ol', ordered[1].replace(/\t/g, '  ').length, ordered[2]); continue }
    if (line.startsWith('> ')) { flushPara(); closeList(); if (!inQuote) { out.push('<blockquote>'); inQuote = true } out.push(`<p>${inlineFmt(line.slice(2))}</p>`); continue }
    if (line.startsWith('---')) { flushPara(); closeList(); closeQuote(); out.push('<hr/>'); continue }
    closeList(); closeQuote(); para.push(line)
  }
  flushPara(); closeList(); closeQuote(); flushCode()
  return out.join('\n')
}

function buildFallback(title, mdBody, withArticleContentId = false) {
  const article = mdToHtml(mdBody)
  const nav = NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
  const socials = SOCIAL_LINKS.map(([href, label]) => `<a href="${href}" rel="me">${label}</a>`).join(' · ')
  const articleId = withArticleContentId ? ' id="article-content"' : ''
  return `<header><h1>${escape(title)}</h1></header><article${articleId}>${article}</article><nav>${nav}</nav><footer>${socials}</footer>`
}

function buildArticleFallback(route) {
  const nav = NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
  const socials = SOCIAL_LINKS.map(([href, label]) => `<a href="${href}" rel="me">${label}</a>`).join(' · ')
  return `<article id="article-content" data-article-engine="article">
    <header>
      <h1>${escape(route.title)}</h1>
      ${route.description ? `<p>${escape(route.description)}</p>` : ''}
    </header>
    ${route.heroImage ? `<figure><img src="${escape(route.heroImage)}" alt="${escape(route.title)}" /></figure>` : ''}
    <section>${route.bodyHtml || ''}</section>
  </article><nav>${nav}</nav><footer>${socials}</footer>`
}

function buildGeneratedBlogFallback(route) {
  const article = mdToHtml(route.markdown || '')
  const nav = NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
  const socials = SOCIAL_LINKS.map(([href, label]) => `<a href="${href}" rel="me">${label}</a>`).join(' · ')
  return `<article id="article-content" data-article-engine="article">
    <header>
      <h1>${escape(route.title)}</h1>
      ${route.description ? `<p>${escape(route.description)}</p>` : ''}
    </header>
    ${route.heroImage ? `<figure><img src="${escape(route.heroImage)}" alt="${escape(route.title)}" /></figure>` : ''}
    <section>${article}</section>
  </article><nav>${nav}</nav><footer>${socials}</footer>`
}

function getRouteMd(route) {
  if (route.markdown) return route.markdown
  if (route.kind === 'generated-blog-post' || route.kind === 'topic-page' || route.kind === 'article-page') {
    return route.markdown || ''
  }
  const tplPath = path.join('scripts', 'markdown', `${route.slug}.md`)
  if (fs.existsSync(tplPath)) {
    // Strip the leading "# title" line so we don't duplicate the <h1> in fallback's <header>.
    const raw = fs.readFileSync(tplPath, 'utf8')
    return raw.replace(/^#\s+[^\n]*\n+/, '')
  }
  return null
}

const SCHEMA_BY_SLUG = {
  'markdown-vs-html': (r) => articleSchema(r),
  about: () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${SITE_URL}/#person` },
    url: `${SITE_URL}/about/`,
  }),
  'en-about': () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${SITE_URL}/#person` },
    url: `${SITE_URL}/en/about/`,
    inLanguage: 'en',
  }),
  blog: (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Блог — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/blog/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Design engineering', 'Claude Code', 'Codex', 'MCP'],
    inLanguage: 'ru',
  }),
  'en-blog': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog — Daniil Okhlopkov',
    description: r.description,
    url: `${SITE_URL}/en/blog/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'MCP', 'Telegram'],
    inLanguage: 'en',
  }),
  articles: (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Статьи — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/articles/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'OpenClaw', 'MCP', 'AI tools'],
    inLanguage: 'ru',
  }),
  'en-articles': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Articles — Daniil Okhlopkov',
    description: r.description,
    url: `${SITE_URL}/en/articles/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'MCP', 'Telegram'],
    inLanguage: 'en',
  }),
  'articles-ai-tools-for-designers-design-engineering-agents': (r) => articleSchema(r, {
    video: {
      '@type': 'VideoObject',
      name: 'ИИ не вывозит норм дизайн или это skill issue? | Подкаст «Мой AI сетап»',
      thumbnailUrl: ['https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg'],
      uploadDate: '2026-05-21',
      embedUrl: 'https://www.youtube.com/embed/fIEMOzz0_AI',
      url: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
    },
  }),
}

function generatedBlogPostSchema(route) {
  return articleSchema(route, {
    keywords: [route.primaryKeyword, ...(route.secondaryKeywords || [])].filter(Boolean),
    about: (route.tags || []).map((name) => ({ '@type': 'Thing', name })),
    articleSection: 'Блог',
  })
}

function articlePageSchema(route) {
  return articleSchema(route, {
    dateModified: route.updatedAt ? `${route.updatedAt}T00:00:00+03:00` : STATIC_UPDATED_AT,
    articleSection: route.lang === 'en' ? 'Blog' : 'Блог',
  })
}

const BREADCRUMBS_BY_SLUG = {
  'en': [['Home', `${SITE_URL}/`], ['English', `${SITE_URL}/en/`]],
  'en-blog': [['Home', `${SITE_URL}/en/`], ['Blog', `${SITE_URL}/en/blog/`]],
  'en-articles': [['Home', `${SITE_URL}/en/`], ['Articles', `${SITE_URL}/en/articles/`]],
  'en-about': [['Home', `${SITE_URL}/en/`], ['About', `${SITE_URL}/en/about/`]],
  'about': [['Главная', `${SITE_URL}/`], ['Обо мне', `${SITE_URL}/about/`]],
  'blog': [['Главная', `${SITE_URL}/`], ['Блог', `${SITE_URL}/blog/`]],
  'articles': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`]],
  'articles-ai-tools-for-designers-design-engineering-agents': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['AI-инструменты для дизайнеров', `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`]],
  'private-channel': [['Главная', `${SITE_URL}/`], ['Закрытый канал', `${SITE_URL}/private-channel/`]],
  'markdown-vs-html': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['Markdown мёртв', `${SITE_URL}/articles/markdown-vs-html/`]],
  'privacy': [['Home', `${SITE_URL}/`], ['Privacy Policy', `${SITE_URL}/privacy/`]],
}

function buildBreadcrumb(route) {
  const items = route.kind === 'generated-blog-post'
    ? [['Главная', `${SITE_URL}/`], ['Блог', `${SITE_URL}/blog/`], [route.title, `${SITE_URL}${route.path}/`]]
    : route.kind === 'article-page'
      ? [[route.lang === 'en' ? 'Home' : 'Главная', `${SITE_URL}${route.lang === 'en' ? '/en/' : '/'}`], [route.lang === 'en' ? 'Blog' : 'Блог', `${SITE_URL}${route.lang === 'en' ? '/en/blog/' : '/blog/'}`], [route.title, `${SITE_URL}${route.path}/`]]
    : route.kind === 'topic-page'
      ? [['Главная', `${SITE_URL}/`], ['Темы', `${SITE_URL}/articles/`], [route.topicTitle || route.title, `${SITE_URL}${route.path}/`]]
    : BREADCRUMBS_BY_SLUG[route.slug]
  if (!items) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({
      '@type': 'ListItem', position: i + 1, name, item,
    })),
  }
}

function isoDateTime(value) {
  if (!value) return ''
  if (value.includes('T')) return value
  return `${value}T00:00:00+03:00`
}

function buildArticleOgMeta(route) {
  const tags = (route.tags || []).filter(Boolean)
  const published = isoDateTime(route.publishedAt)
  const modified = isoDateTime(route.updatedAt || route.publishedAt)
  const section = route.section || (route.lang === 'en' ? 'Blog' : 'Блог')
  const rows = [
    published && `<meta property="article:published_time" content="${escape(published)}" />`,
    modified && `<meta property="article:modified_time" content="${escape(modified)}" />`,
    '<meta property="article:author" content="Даниил Охлопков" />',
    section && `<meta property="article:section" content="${escape(section)}" />`,
    ...tags.map((tag) => `<meta property="article:tag" content="${escape(tag)}" />`),
  ].filter(Boolean)
  return rows.map((row) => `  ${row}`).join('\n')
}

function rewrite(html, route) {
  const { path: routePath, slug, title, description } = route
  // Trailing slash = canonical form on GitHub Pages (served as 200 directly;
  // non-slash variant 301-redirects). Must match sitemap.xml.
  const url = `${SITE_URL}${routePath}/`
  const mdHref = `/${slug}.md`
  const isNoindex = route.robots?.startsWith('noindex')
  const lang = route.lang || 'ru'
  const ogLocale = lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU'
  const articleRoute = isArticleRoute(route)
  const ogType = articleRoute ? 'article' : 'website'
  const image = route.image || 'https://github.com/ohld.png'
  const mdBody = getRouteMd(route)
  const fallback = route.kind === 'article-page'
    ? buildArticleFallback(route)
    : route.kind === 'generated-blog-post'
      ? buildGeneratedBlogFallback(route)
      : mdBody ? buildFallback(title, mdBody, articleRoute) : buildFallback(title, '', articleRoute)
  let out = applySiteUrl(html)
    .replace(/<html lang="[^"]+">/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, `$1${route.robots || 'index, follow'}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${ogLocale}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+" \/>\n?    /g, '')
    .replace('    <link rel="alternate" type="text/markdown"', `${buildHreflang(route, url)}    <link rel="alternate" type="text/markdown"`)
    .replace(/<link rel="alternate" type="text\/markdown" href="[^"]*" \/><!-- alternate-md -->/, isNoindex ? '<!-- no markdown alternate for noindex page -->' : `<link rel="alternate" type="text/markdown" href="${mdHref}" /><!-- alternate-md -->`)
    .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, open, json, close) => {
      try {
        const data = JSON.parse(json)
        data.mainEntityOfPage = url
        return `${open}\n    ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}\n    ${close}`
      } catch {
        return `${open}${json}${close}`
      }
    })
    .replace('<!-- body-fallback -->', fallback)
  const extraSchema = route.kind === 'generated-blog-post'
    ? generatedBlogPostSchema(route)
    : route.kind === 'article-page'
      ? articlePageSchema(route)
    : route.kind === 'topic-page'
      ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: route.topicTitle || route.title,
        description: route.description,
        url: `${SITE_URL}${route.path}/`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'ru',
      }
    : SCHEMA_BY_SLUG[slug]?.(route)
  if (extraSchema) {
    const extraJson = jsonForHtml(extraSchema)
    const block = `<script id="page-structured-data" type="application/ld+json">\n${extraJson}\n</script>\n  </head>`
    out = out.replace('</head>', block)
  }
  const crumb = buildBreadcrumb(route)
  if (crumb) {
    const crumbJson = jsonForHtml(crumb)
    const block = `<script id="breadcrumb-structured-data" type="application/ld+json">\n${crumbJson}\n</script>\n  </head>`
    out = out.replace('</head>', block)
  }
  if (articleRoute) {
    out = out.replace('</head>', `${buildArticleOgMeta(route)}\n  </head>`)
  }
  return out
}

function buildHreflang(route, canonicalUrl) {
  const alternates = route.alternates || {
    ru: canonicalUrl,
    'x-default': canonicalUrl,
  }
  return Object.entries(alternates)
    .map(([lang, href]) => `    <link rel="alternate" hreflang="${lang}" href="${href}" />\n`)
    .join('')
}

// ---- HTML prerender ----
let htmlCount = 0
// Home: rewrite #root fallback in dist/index.html (vite build wrote it, we patch in place).
const homeFallback = buildFallback('Даниил Охлопков', HOME_FALLBACK_MD.replace(/^#\s+[^\n]*\n+/, ''))
const homeOut = applySiteUrl(indexHtml).replace('<!-- body-fallback -->', homeFallback)
fs.writeFileSync(path.join(dist, 'index.html'), homeOut)

for (const route of ROUTES) {
  const html = rewrite(indexHtml, route)
  const dir = path.join(dist, route.path)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  htmlCount++
}

// ---- Markdown for Agents ----
// Static templates for each route.
const templatesDir = path.join('scripts', 'markdown')

let mdCount = 0
for (const route of ROUTES) {
  if (route.robots?.startsWith('noindex')) continue
  const src = path.join(templatesDir, `${route.slug}.md`)
  const dest = path.join(dist, `${route.slug}.md`)
  if (route.kind === 'generated-blog-post' || route.kind === 'topic-page' || route.kind === 'article-page') {
    fs.writeFileSync(dest, `# ${route.title}\n\n${route.markdown}\n`)
  } else {
    fs.copyFileSync(src, dest)
  }
  mdCount++
}

// ---- Redirects (old URLs) ----
// Write stub HTML + .md for old slugs that 301-equivalent to the new canonical
// via meta-refresh + canonical tag (no real 301 possible on GH Pages).
// SPA-side React Router also handles these via <Navigate> for in-app nav.
const REDIRECTS = [
  { from: '/closed', fromSlug: 'closed', to: '/private-channel/', toSlug: 'private-channel' },
  { from: '/ru', fromSlug: 'ru', to: '/', toSlug: 'home' },
  { from: '/work-together', fromSlug: 'work-together', to: '/about/', toSlug: 'about' },
  { from: '/markdown-vs-html', fromSlug: 'markdown-vs-html-old', to: '/articles/markdown-vs-html/', toSlug: 'markdown-vs-html' },
  { from: '/posts', fromSlug: 'posts', to: '/blog/', toSlug: 'blog' },
  { from: '/ai-agents', fromSlug: 'ai-agents', to: '/articles/', toSlug: 'articles' },
  { from: '/ai-course', fromSlug: 'ai-course', to: '/articles/', toSlug: 'articles' },
  { from: '/blog/ai-tools-for-designers-design-engineering-agents', fromSlug: 'blog-ai-tools-for-designers-design-engineering-agents', to: '/articles/ai-tools-for-designers-design-engineering-agents/', toSlug: 'articles-ai-tools-for-designers-design-engineering-agents' },
  { from: '/author/okhlopkov', fromSlug: 'author-okhlopkov', to: '/about/', toSlug: 'about' },
  { from: '/projects', fromSlug: 'projects', to: '/about/', toSlug: 'about' },
  { from: '/tag/second-brain', fromSlug: 'tag-second-brain', to: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/', toSlug: 'vtoroj-mozg-ai-assistent-obsidian-claude-code' },
  { from: '/tag/ai-agents', fromSlug: 'tag-ai-agents', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/telegram', fromSlug: 'tag-telegram', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/ai', fromSlug: 'tag-ai', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/analytics', fromSlug: 'tag-analytics', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/claude-code', fromSlug: 'tag-claude-code', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/crypto', fromSlug: 'tag-crypto', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/dokku', fromSlug: 'tag-dokku', to: '/cloudflare-certificates-dokku/', toSlug: 'cloudflare-certificates-dokku' },
  { from: '/tag/parsing', fromSlug: 'tag-parsing', to: '/how-to-get-a-telegram-channel-subscribers-list-in-python/', toSlug: 'how-to-get-a-telegram-channel-subscribers-list-in-python' },
  { from: '/tag/telegram-cn', fromSlug: 'tag-telegram-cn', to: '/en/', toSlug: 'en' },
  { from: '/tag/telegram-en', fromSlug: 'tag-telegram-en', to: '/en/', toSlug: 'en' },
  { from: '/tag/web-scraping', fromSlug: 'tag-web-scraping', to: '/web-scraping-ai-agents-2026/', toSlug: 'web-scraping-ai-agents-2026' },
  { from: '/cn', fromSlug: 'cn', to: '/en/', toSlug: 'en' },
  { from: '/my-tg-bots', fromSlug: 'my-tg-bots', to: '/about/', toSlug: 'about' },
  { from: '/vibe-coding-guide-2026', fromSlug: 'vibe-coding-guide-2026', to: '/articles/', toSlug: 'articles' },
]
let redirectCount = 0
for (const r of REDIRECTS) {
  const targetUrl = `${SITE_URL}${r.to}`
  const stub = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting…</title>
  <link rel="canonical" href="${targetUrl}" />
  <meta name="robots" content="noindex, follow" />
  <meta http-equiv="refresh" content="0; url=${r.to}" />
  <script>window.location.replace(${JSON.stringify(r.to)})</script>
</head>
<body>
  <p>Эта страница переехала на <a href="${r.to}">${r.to}</a></p>
</body>
</html>
`
  const dir = path.join(dist, r.from)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), stub)
  fs.writeFileSync(
    path.join(dist, `${r.fromSlug}.md`),
    `# Redirected\n\nThis page moved to [${targetUrl}](${targetUrl}).\n`
  )
  redirectCount++
}

// ---- llms-full.txt — concatenated bundle of all .md files ----
const BUNDLE_SLUGS = [
  'en',
  'en-about',
  'about',
  'blog',
  'en-blog',
  'articles',
  'en-articles',
  'articles-ai-tools-for-designers-design-engineering-agents',
  'markdown-vs-html',
  'privacy',
  ...GENERATED_BLOG_POSTS.map((post) => `blog-${post.slug}`),
  ...TOPIC_PAGES.map(([slug]) => `topic-${slug}`),
]
const bundleHeader = `# Daniil Okhlopkov — Full Content Bundle

> Combined Markdown of all pages on okhlopkov.com. For AI crawlers that prefer one-shot fetch.

`
const bundleParts = BUNDLE_SLUGS.map(slug => {
  const content = fs.readFileSync(path.join(dist, `${slug}.md`), 'utf8')
  return `## Source: /${slug}.md\n\n${content}`
})
fs.writeFileSync(path.join(dist, 'llms-full.txt'), bundleHeader + bundleParts.join('\n\n---\n\n'))

const llmsPath = path.join(dist, 'llms.txt')
if (fs.existsSync(llmsPath)) {
  fs.writeFileSync(llmsPath, applySiteUrl(fs.readFileSync(llmsPath, 'utf8')))
}

fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`)

// ---- Minimal XML sitemap for Google Search Console ----
const SITEMAP_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/en/`,
  `${SITE_URL}/about/`,
  `${SITE_URL}/en/about/`,
  `${SITE_URL}/blog/`,
  `${SITE_URL}/en/blog/`,
  `${SITE_URL}/articles/`,
  `${SITE_URL}/en/articles/`,
  `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`,
  `${SITE_URL}/articles/markdown-vs-html/`,
  `${SITE_URL}/privacy/`,
].map((loc) => ({
  loc,
  lastmod: STATIC_UPDATED_DATE,
}))

function addSitemapUrl(pathname, lastmod = STATIC_UPDATED_DATE) {
  SITEMAP_URLS.push({
    loc: `${SITE_URL}${pathname}`,
    lastmod,
  })
}

function sitemapUrlXml({ loc, lastmod }) {
  return `  <url>
    <loc>${xmlText(loc)}</loc>
    <lastmod>${xmlText(lastmod)}</lastmod>
  </url>`
}

function xmlText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function articleMarkdown(article, body) {
  const title = article.title || 'Daniil Okhlopkov'
  const description = article.description ? `\n\n> ${article.description}` : ''
  const sourceUrl = `${SITE_URL}${article.path}`
  return `# ${title}${description}

Source: ${sourceUrl}

${stripTags(body)}
`
}

for (const post of GENERATED_BLOG_POSTS) {
  addSitemapUrl(`/blog/${post.slug}/`, post.updatedAt || STATIC_UPDATED_DATE)
}
for (const [slug] of TOPIC_PAGES) {
  addSitemapUrl(`/topics/${slug}/`)
}
for (const article of IMPORTED_ARTICLES) {
  if (article.path) addSitemapUrl(article.path)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_URLS.map(sitemapUrlXml).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
console.log(`✓ Sitemap: generated ${SITEMAP_URLS.length} canonical URLs`)

console.log(`✓ Prerendered ${htmlCount} HTML routes + ${mdCount} Markdown files + ${redirectCount} redirects + ${IMPORTED_ARTICLES.length} imported articles + llms-full.txt`)
