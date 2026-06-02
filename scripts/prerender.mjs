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
const STATIC_UPDATED_DATE = '2026-05-26'
const STATIC_UPDATED_AT = `${STATIC_UPDATED_DATE}T00:00:00+03:00`
const BLOG_POSTS_DIR = path.join('content', 'blog-posts')
const SEO_ARTICLES_DIR = path.join('content', 'seo-articles')
const IMPORTED_ARTICLES_INDEX = path.join('content', 'articles', 'imported-index.json')
const IMPORTED_ARTICLES_CONTENT = path.join('content', 'articles', 'imported-content.json')
const LOCALIZED_GROUPS_PATH = path.join('content', 'articles', 'localized-groups.json')
const ARTICLE_SEO_ENHANCEMENTS_PATH = path.join('content', 'articles', 'seo-enhancements.json')
const LEGACY_REDIRECTS_PATH = path.join('content', 'articles', 'legacy-redirects.json')

function readJsonFile(filePath, fallback) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback
}

const ARTICLE_SEO_ENHANCEMENTS = readJsonFile(ARTICLE_SEO_ENHANCEMENTS_PATH, {})
const LEGACY_REDIRECTS = readJsonFile(LEGACY_REDIRECTS_PATH, [])

const NAV_LINKS_BY_SHELL_LANG = {
  ru: [
    ['/ru/blog/', 'Блог'],
    ['/ru/articles/', 'Статьи'],
    ['/about/', 'Обо мне'],
    ['/en/', 'English'],
  ],
  en: [
    ['/en/blog/', 'Blog'],
    ['/en/articles/', 'Articles'],
    ['/en/about/', 'About'],
    ['/', 'RU'],
  ],
}

const SOCIAL_LINKS = [
  ['https://t.me/danokhlopkov', 'Telegram'],
  ['https://youtube.com/@danokhlopkov', 'YouTube'],
  ['https://instagram.com/d7733o', 'Instagram'],
  ['https://x.com/danokhlopkov', 'X'],
  ['https://www.linkedin.com/in/danokhlopkov/', 'LinkedIn'],
  ['https://github.com/ohld', 'GitHub'],
]

function navLinksForLang(lang = 'ru') {
  return NAV_LINKS_BY_SHELL_LANG[lang === 'ru' ? 'ru' : 'en']
}

function fallbackNav(lang = 'ru') {
  return navLinksForLang(lang).map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
}

function fallbackSocials() {
  return SOCIAL_LINKS.map(([href, label]) => `<a href="${href}" rel="me">${label}</a>`).join(' · ')
}

const ARTICLE_LANGS = ['ru', 'en', 'zh']
const LOCALIZED_GROUPS = JSON.parse(fs.readFileSync(LOCALIZED_GROUPS_PATH, 'utf8'))

function canonicalPathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

const LEGACY_REDIRECT_FROM_PATHS = new Set(LEGACY_REDIRECTS.map((redirect) => canonicalPathname(redirect.from)))

function getArticleSeoEnhancement(pathname) {
  return ARTICLE_SEO_ENHANCEMENTS[canonicalPathname(pathname)] || null
}

function applyArticleSeoEnhancement(pathname, html = '') {
  if (!html || html.includes('data-seo-enhancement=')) return html
  const enhancement = getArticleSeoEnhancement(pathname)
  if (!enhancement) return html
  const summary = enhancement.summaryHtml
    ? `<section class="article-callout article-seo-summary" data-seo-enhancement="summary">${enhancement.summaryHtml}</section>`
    : ''
  const faq = enhancement.faqHtml
    ? `<section class="article-faq" data-seo-enhancement="faq">${enhancement.faqHtml}</section>`
    : ''
  return `${summary}${html}${faq}`
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

> AI-native аналитика, on-chain данные, Telegram и агентские workflow. Здесь свежие тексты про инструменты, эксперименты и рабочие схемы. Бэкграунд, опыт и ссылки — на странице [обо мне](/about/).

## Свежие материалы

![Мой AI-сетап 2026](/assets/blog/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty/phone-agent-meme.webp)

- [Hermes Agent vs OpenClaw: что выбрать для AI-агента](/ru/articles/hermes-agent-vs-openclaw/)
- [AI-рилзы для SEO: как собрать video pipeline из Telegram-трендов](/ru/articles/ai-reels-seo-pipeline-telegram-claude-code/)
- [Мой AI-сетап 2026: Claude Code, Cursor, Ghostty, Spokenly и база всех чатов](/ru/blog/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty/)
- [Telegram Mini App с Claude Code: llms.txt, крестики-нолики и деплой без чтения доков](/ru/blog/vibecoding-telegram-mini-app-claude-code/)
- [AI-агенты ведут проект, пока я в отпуске: Claude Code, Paperclip и GStack без магии](/ru/blog/business-on-ai-agent-claude-code-paperclip-gstack/)
- [AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code](/ru/articles/ai-tools-for-designers-design-engineering-agents/)

[Блог](/ru/blog/) · [Статьи](/ru/articles/)

## Что здесь читать

Главная — это карта свежих материалов, а не ещё одна версия резюме. Я оставляю здесь тексты, которые помогают быстро понять, какие инструменты и подходы сейчас проходят проверку практикой: AI-агенты, рабочие процессы вокруг Codex и Claude Code, on-chain аналитика, Telegram-автоматизация и личные системы для памяти проекта.

В блог попадают тексты, которые выросли из моих Telegram-постов: исходная мысль остаётся узнаваемой, а вокруг неё добавляются контекст, ссылки, примеры и заметки из других источников. В статьи уходят отдельные поисковые темы, где нужен плотный гайд, сравнение, таблицы, промпты и выводы. Оба формата нужны: короткие посты дают контекст, длинные статьи помогают разобраться глубже.

Часть заметок короткая и полезна как быстрый ориентир перед решением похожей задачи. Часть материалов длиннее: там я разбираю контекст, ограничения, альтернативы и практический результат. Общая идея простая: сайт должен быть не витриной, а рабочим архивом проверенных находок, к которым можно вернуться через неделю или отправить ссылку человеку с похожим вопросом. Всё это пишется для практики, а не отчётности.

## Основные темы

Если вы впервые на сайте, начните с материалов про мой AI-сетап, практику работы с агентами и разборы инструментов, которые уже прошли через реальные задачи. Я стараюсь оставлять не абстрактные впечатления, а конкретику: что ускорило работу, где пришлось менять процесс, какие настройки можно повторить и какие выводы лучше сохранить для следующего проекта.

Дальше удобно идти по темам: AI-агенты для рабочих задач, Codex и Claude Code для разработки, TON-данные для исследований, Telegram-автоматизация для продуктов и каналов, second brain для личной памяти. Хороший материал здесь должен помогать сделать следующий шаг: проверить гипотезу, собрать прототип, настроить workflow или не повторить уже найденную ошибку.

- [AI-агенты](/topics/ai-agents/) — практические сценарии, где агент не просто отвечает в чате, а читает контекст, работает с файлами, проверяет себя и доводит задачу до результата.
- [Claude Code](/topics/claude-code/) и [Codex](/topics/codex/) — настройки, skills, MCP, hooks, browser smoke, ревью diff и длинные задачи, которые нужно держать в управляемом цикле.
- [TON-данные](/topics/ton-data/) — on-chain аналитика, Dune, исследовательские запросы, метрики и способы превратить сырые данные в решение для продукта или команды.
- [Telegram-автоматизация](/topics/telegram-automation/) — mini apps, боты, контентные пайплайны, каналы и рабочие интерфейсы, где Telegram становится частью операционной системы.
- [Second brain](/topics/second-brain/) — Obsidian, GBrain, проектная память, raw notes и правила, которые помогают не терять решения после длинных agent-сессий.

## Как пользоваться сайтом

Если вы пришли из поиска на конкретную статью, лучше продолжать на языке этой страницы: русские материалы живут в разделе [Блог](/ru/blog/) и [Статьи](/ru/articles/), английские — в [Blog](/en/blog/) и [Articles](/en/articles/). Переключатель RU/EN в шапке не прячет страницы за автопереездом, поэтому поисковики и люди видят стабильные адреса.

Я стараюсь писать не обзор ради обзора, а рабочие заметки после реального теста: что ускорило задачу, где инструмент сломался, какие настройки стоит повторить и какие выводы лучше сохранить в проектной памяти. Поэтому главная показывает последние материалы с картинками, а полный архив остаётся в разделах.
`

const EN_HOME_FALLBACK_MD = `# Daniil Okhlopkov

> AI-native analytics, on-chain data, Telegram and agent workflows. This page is for fresh writing and practical notes from the tools I actually test. Background, work history and links live on [About](/en/about/).

## Latest Writing

![My Claude Code setup](/assets/site/article-fallback.webp)

- [Claude Code /compact: Context Compression, Compaction Prompts, What Survives](/claude-code-compaction-explained/)
- [My Claude Code Setup: MCP Servers, Hooks, Skills and Agents (2026)](/claude-code-setup-mcp-hooks-skills-2026/)
- [Web Scraping AI Agents: What Actually Works in 2026](/web-scraping-ai-agents-2026/)
- [My AI Dev Tools in 2026: What I Actually Use Daily](/ai-tools-setup-january-2026/)
- [Best Claude Code Skills and MCP Servers for Agent Workflows](/en-best-skills-mcp-claude-code-agent-browser/)
- [Show Me Your AI Setup #1: Ghostty, ownyourchat, Descript, Spokenly](/en-show-me-ai-setup-ghostty-ownyourchat-descript/)

[Blog](/en/blog/) · [Articles](/en/articles/)

## What to Read Here

The homepage is a map of recent writing, not another copy of my resume. I keep it focused on tools and workflows that are being tested in actual work: AI agents, Codex and Claude Code operating loops, on-chain analytics, Telegram automation and personal systems for project memory.

Blog posts are pieces that grew out of my Telegram writing: the original idea stays recognizable, then gets enriched with context, links, examples and notes from other sources. Articles are separate search-driven topics that need a denser guide, comparison, tables, prompts and takeaways. Both formats matter: shorter posts provide context, longer articles help unpack the subject in more depth.

Some notes are short and useful as a quick reference before solving a similar task. Other pieces are longer: they unpack context, constraints, alternatives and the practical result. The simple idea is that the site should work as a useful archive of tested findings, not a display case, so a link is worth revisiting a week later or sending to someone with the same question. Everything is written for practice, not reporting.

## Main Topics

If this is your first visit, start with the pieces about my AI setup, agent workflows and tool reviews that already went through real work. I try to write down concrete takeaways rather than abstract impressions: what made the work faster, where the process had to change, which settings are worth copying and which lessons should be kept for the next project.

From there, it is easiest to follow the topic pages: AI agents for practical work, Codex and Claude Code for development, TON data for research, Telegram automation for products and channels, second brain systems for personal memory. A useful article here should help with a next step: test a hypothesis, build a prototype, tune a workflow or avoid a mistake that already showed up in practice.

- [AI agents](/topics/ai-agents/) — practical workflows where an agent reads context, works with files, checks its own output and carries a task through to a concrete result.
- [Claude Code](/topics/claude-code/) and [Codex](/topics/codex/) — skills, MCP, hooks, browser smoke checks, diff review and long tasks that need a controlled operating loop.
- [TON data](/topics/ton-data/) — on-chain analytics, Dune, research queries, product metrics and ways to turn raw blockchain data into a decision a team can use.
- [Telegram automation](/topics/telegram-automation/) — mini apps, bots, content pipelines, channels and operational interfaces where Telegram becomes part of the work system.
- [Second brain](/topics/second-brain/) — Obsidian, GBrain, project memory, raw notes and rules that keep decisions available after long agent sessions.

## How to Use the Site

If you arrive from search on a specific article, the best next step is usually to stay with that page language: Russian material lives in [Blog](/ru/blog/) and [Articles](/ru/articles/), English material lives in [Blog](/en/blog/) and [Articles](/en/articles/). The RU/EN switcher keeps those addresses stable instead of hiding them behind a forced redirect, which is better for readers and search crawlers.

I try to publish notes after real use rather than writing abstract tool roundups: what sped up the task, where the tool broke, which settings are worth copying and which conclusions should be saved in project memory. That is why the homepage highlights the newest pieces with images, while the full archive stays in the section pages.
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

function loadGeneratedMarkdownEntries(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const fullPath = path.join(dir, file)
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

const GENERATED_BLOG_POSTS = loadGeneratedMarkdownEntries(BLOG_POSTS_DIR)
const GENERATED_SEO_ARTICLES = loadGeneratedMarkdownEntries(SEO_ARTICLES_DIR)

function generatedBlogPath(post) {
  return post.lang === 'en' ? `/en/blog/${post.slug}` : `/ru/blog/${post.slug}`
}

function generatedArticlePath(article) {
  return article.lang === 'en' ? `/en/articles/${article.slug}` : `/ru/articles/${article.slug}`
}

function loadImportedArticleRows() {
  if (!fs.existsSync(IMPORTED_ARTICLES_INDEX) || !fs.existsSync(IMPORTED_ARTICLES_CONTENT)) return []
  const index = JSON.parse(fs.readFileSync(IMPORTED_ARTICLES_INDEX, 'utf8'))
  const content = JSON.parse(fs.readFileSync(IMPORTED_ARTICLES_CONTENT, 'utf8'))
  const bodyByPath = new Map(content.map((article) => [article.path, normalizeImportedArticleHtml(article.bodyHtml || '')]))
  return index
    .filter((article) => !LEGACY_REDIRECT_FROM_PATHS.has(canonicalPathname(article.path)))
    .map((article) => {
      const enhancement = getArticleSeoEnhancement(article.path)
      const description = enhancement?.description || article.description || ''
      const bodyHtml = addMissingImageAlts(
        bodyByPath.get(article.path) || '',
        article.title || description || 'Daniil Okhlopkov article image',
      )
      return {
        ...article,
        description,
        bodyHtml: applyArticleSeoEnhancement(article.path, bodyHtml),
      }
    })
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
  ['hermes-agent', 'Hermes Agent', 'Hermes Agent, Telegram/VPS, skills, memory и self-hosted personal AI workflows.'],
  ['ton-data', 'TON-данные', 'On-chain analytics, TON research, Dune, EVAA, USDT и AI-ассистенты для анализа данных.'],
  ['telegram-automation', 'Telegram-автоматизация', 'Telegram bots, Mini Apps, voice workflows, AI-агенты в чатах и автоматизация через Telegram.'],
]

function topicMarkdown(title, description) {
  return `${description}

## Материалы

- [Блог](/ru/blog/) — записи и рабочие заметки.
- [Статьи](/ru/articles/) — гайды, сравнения и туториалы.
- [AI-агенты: с чего начать в 2026](/ru/blog/ai-agents-s-chego-nachat/)
- [GStack, /goal и office hours](/ru/blog/gstack-goal-office-hours-ai-workflow/)
- [Claude Code vs Codex](/ru/blog/claude-code-vs-codex-perehod/)
- [Hermes Agent vs OpenClaw](/ru/articles/hermes-agent-vs-openclaw/)
- [AI-инструменты для дизайнеров](/ru/articles/ai-tools-for-designers-design-engineering-agents/)

## Смежные темы

[AI-агенты](/topics/ai-agents/) · [Claude Code](/topics/claude-code/) · [Codex](/topics/codex/) · [MCP](/topics/mcp/) · [GStack](/topics/gstack/) · [OpenClaw](/topics/openclaw/) · [Hermes Agent](/topics/hermes-agent/) · [TON-данные](/topics/ton-data/) · [Telegram](/topics/telegram-automation/)
`
}

const ROUTES = [
  {
    path: '/',
    slug: 'home',
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: 'Практические разборы AI-агентов, Claude Code, Codex, MCP, TON-аналитики и Telegram-автоматизаций от Даниила Охлопкова.',
    alternates: {
      ru: `${SITE_URL}/ru/`,
      en: `${SITE_URL}/en/`,
      'x-default': `${SITE_URL}/`,
    },
    markdown: HOME_FALLBACK_MD,
  },
  {
    path: '/ru',
    slug: 'ru',
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: 'Практические разборы AI-агентов, Claude Code, Codex, MCP, TON-аналитики и Telegram-автоматизаций от Даниила Охлопкова.',
    alternates: {
      ru: `${SITE_URL}/ru/`,
      en: `${SITE_URL}/en/`,
      'x-default': `${SITE_URL}/`,
    },
    markdown: HOME_FALLBACK_MD,
  },
  {
    path: '/en',
    slug: 'en',
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/ru/`,
      en: `${SITE_URL}/en/`,
      'x-default': `${SITE_URL}/`,
    },
    markdown: EN_HOME_FALLBACK_MD,
  },
  {
    path: '/en/about',
    slug: 'en-about',
    title: 'Daniil Okhlopkov — AI Agents, TON Analytics and Telegram',
    description: 'Daniil Okhlopkov leads analytics at TON Foundation and writes about AI agents, on-chain analytics, Telegram workflows, data products and startups.',
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
    title: 'Даниил Охлопков — AI-агенты, TON-аналитика и Telegram',
    description: 'Даниил Охлопков: Head of Analytics @ TON Foundation, Forbes 30 under 30, бывший CTO Via Protocol. AI-агенты, on-chain analytics и Telegram.',
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
      ru: `${SITE_URL}/ru/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/ru/blog/`,
    },
  },
  {
    path: '/ru/blog',
    slug: 'ru-blog',
    title: 'Блог — Даниил Охлопков',
    description: 'Рабочие заметки Даниила Охлопкова про AI-агентов, Claude Code, Codex, MCP, GBrain, Telegram-автоматизацию и реальные agent workflows.',
    alternates: {
      ru: `${SITE_URL}/ru/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/ru/blog/`,
    },
  },
  {
    path: '/en/articles',
    slug: 'en-articles',
    title: 'Articles — Daniil Okhlopkov',
    description: 'English tutorials and evergreen explainers by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP and automation.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/ru/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/ru/articles/`,
    },
  },
  {
    path: '/ru/articles',
    slug: 'ru-articles',
    title: 'Статьи — Даниил Охлопков',
    description: 'Гайды и сравнения Даниила Охлопкова про AI-агентов, OpenClaw, Hermes Agent, Claude Code, Codex, MCP, design engineering и Telegram workflows.',
    alternates: {
      ru: `${SITE_URL}/ru/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/ru/articles/`,
    },
  },
  {
    path: '/ru/articles/ai-tools-for-designers-design-engineering-agents',
    slug: 'ru-articles-ai-tools-for-designers-design-engineering-agents',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    description: 'Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.',
    publishedAt: '2026-05-25',
    updatedAt: '2026-05-28',
    tags: ['AI Agents', 'Design Engineering', 'Frontend'],
    section: 'Статьи',
    heroImage: '/assets/articles/ai-tools-for-designers-design-engineering-agents/design-engineering-cover.webp',
    imageAlt: 'Мем-обложка AI-SLOP про design engineering и AI-инструменты для дизайнеров',
    ...imageMetadataForUrl('/assets/articles/ai-tools-for-designers-design-engineering-agents/design-engineering-cover.webp'),
    image: `${SITE_URL}/assets/articles/ai-tools-for-designers-design-engineering-agents/design-engineering-cover.webp`,
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
    title: 'Markdown vs HTML для AI-агентов | Даниил Охлопков',
    description: 'Почему HTML лучше Markdown для AI-агентов: когда агент пишет артефакты, а человек читает и шарит. Сравнение форматов, минусы и промпты.',
    publishedAt: '2026-05-09',
    updatedAt: '2026-05-29',
    tags: ['AI Agents', 'HTML', 'Markdown', 'Claude Code'],
    section: 'Статьи',
    heroImage: '/assets/articles/markdown-vs-html/html-vs-markdown-cover.webp',
    imageAlt: 'Мем-обложка HTML > Markdown: исходная Pinterest-картинка, расширенная до 16:9 для статьи про AI-agent артефакты',
    ...imageMetadataForUrl('/assets/articles/markdown-vs-html/html-vs-markdown-cover.webp'),
    image: `${SITE_URL}/assets/articles/markdown-vs-html/html-vs-markdown-cover.webp`,
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
  const postLang = post.lang || 'ru'
  ROUTES.push({
    path: generatedBlogPath(post),
    slug: `blog-${post.slug}`,
    title: post.title,
    description: post.description,
    lang: postLang,
    alternates: {
      [postLang]: `${SITE_URL}${generatedBlogPath(post)}/`,
      'x-default': `${SITE_URL}${generatedBlogPath(post)}/`,
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
    imageAlt: post.coverAlt || post.title,
    ...imageMetadataForUrl(post.coverImage),
    image: absoluteImageUrl(post.coverImage) || 'https://github.com/ohld.png',
    markdown: post.body,
  })
}

for (const article of GENERATED_SEO_ARTICLES) {
  const articleLang = article.lang || 'ru'
  const articlePath = generatedArticlePath(article)
  ROUTES.push({
    path: articlePath,
    slug: `article-${article.slug}`,
    title: article.title,
    description: article.description,
    lang: articleLang,
    alternates: {
      [articleLang]: `${SITE_URL}${articlePath}/`,
      'x-default': `${SITE_URL}${articlePath}/`,
    },
    kind: 'generated-article-post',
    section: articleLang === 'en' ? 'Articles' : 'Статьи',
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    sourceTelegramId: article.sourceTelegramId,
    primaryKeyword: article.primaryKeyword,
    secondaryKeywords: article.secondaryKeywords,
    tags: article.tags,
    views: article.views,
    forwards: article.forwards,
    comments: article.comments,
    reactions: article.reactions,
    heroImage: article.coverImage,
    imageAlt: article.coverAlt || article.title,
    ...imageMetadataForUrl(article.coverImage),
    image: absoluteImageUrl(article.coverImage) || 'https://github.com/ohld.png',
    markdown: article.body,
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
    imageAlt: article.title,
    ...imageMetadataForUrl(article.heroImage),
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

function imageTypeForUrl(url = '') {
  const cleanUrl = url.split('?')[0].toLowerCase()
  if (cleanUrl.endsWith('.webp')) return 'image/webp'
  if (cleanUrl.endsWith('.avif')) return 'image/avif'
  if (cleanUrl.endsWith('.png')) return 'image/png'
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg'
  if (cleanUrl.endsWith('.gif')) return 'image/gif'
  return undefined
}

function imageMetadataForUrl(url = '') {
  const metadata = {
    imageType: imageTypeForUrl(url),
  }
  if (!url.startsWith('/')) return metadata

  const assetPath = path.join('public', decodeURI(url.replace(/^\//, '')))
  const metaPath = assetPath.replace(/\.[^.]+$/, '.meta.json')
  if (!fs.existsSync(metaPath)) return metadata

  try {
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const webAsset = parsed.web_asset || {}
    if (Number.isFinite(webAsset.width)) metadata.imageWidth = webAsset.width
    if (Number.isFinite(webAsset.height)) metadata.imageHeight = webAsset.height
  } catch (error) {
    console.warn(`Could not read image metadata ${metaPath}: ${error.message}`)
  }

  return metadata
}

function imageHtmlAttributes(url = '', { priority = false, lazy = true } = {}) {
  const metadata = imageMetadataForUrl(url)
  const attrs = ['decoding="async"']
  if (Number.isFinite(metadata.imageWidth)) attrs.push(`width="${metadata.imageWidth}"`)
  if (Number.isFinite(metadata.imageHeight)) attrs.push(`height="${metadata.imageHeight}"`)
  if (priority) attrs.push('fetchpriority="high"')
  else if (lazy) attrs.push('loading="lazy"')
  return attrs.join(' ')
}

function ogImageStructuredMeta(route) {
  const rows = [
    route.imageType && `<meta property="og:image:type" content="${escape(route.imageType)}" />`,
    route.imageWidth && `<meta property="og:image:width" content="${escape(String(route.imageWidth))}" />`,
    route.imageHeight && `<meta property="og:image:height" content="${escape(String(route.imageHeight))}" />`,
  ].filter(Boolean)
  return rows.length ? `${rows.map((row) => `    ${row}`).join('\n')}\n` : ''
}

const AUTHOR_SCHEMA = {
  '@type': 'Person',
  name: 'Даниил Охлопков',
  alternateName: 'Daniil Okhlopkov',
  url: `${SITE_URL}/`,
}

function isArticleRoute(route) {
  return route.kind === 'generated-blog-post'
    || route.kind === 'generated-article-post'
    || route.kind === 'article-page'
    || route.slug === 'markdown-vs-html'
    || route.slug === 'articles-ai-tools-for-designers-design-engineering-agents'
    || route.slug === 'ru-articles-ai-tools-for-designers-design-engineering-agents'
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

function faqSchema(route) {
  const markdown = route.markdown || getRouteMd(route) || ''
  if (!markdown) return null

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const items = []
  let inFaq = false
  let current = null

  const flush = () => {
    if (!current) return
    const answer = markdownToText(current.answer.join('\n'))
    const question = markdownToText(current.question)
    if (question && answer) {
      items.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })
    }
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (/^##\s+FAQ\s*$/i.test(line)) {
      inFaq = true
      continue
    }
    if (!inFaq) continue
    if (/^##\s+/.test(line)) {
      flush()
      break
    }
    const question = line.match(/^###\s+(.+)$/)
    if (question) {
      flush()
      current = { question: question[1], answer: [] }
      continue
    }
    if (current) current.answer.push(rawLine)
  }
  flush()

  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${route.path}/#faq`,
    mainEntity: items,
  }
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
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${url.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" ${imageHtmlAttributes(url, { lazy: true })} />`)
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

function buildFallback(title, mdBody, withArticleContentId = false, lang = 'ru') {
  const article = mdToHtml(mdBody)
  const nav = fallbackNav(lang)
  const socials = fallbackSocials()
  const articleId = withArticleContentId ? ' id="article-content"' : ''
  return `<header><h1>${escape(title)}</h1></header><article${articleId}>${article}</article><nav>${nav}</nav><footer>${socials}</footer>`
}

function buildArticleFallback(route) {
  const nav = fallbackNav(route.lang)
  const socials = fallbackSocials()
  const imageAlt = route.imageAlt || route.title
  return `<article id="article-content" data-article-engine="article">
    <header>
      <h1>${escape(route.title)}</h1>
      ${route.description ? `<p>${escape(route.description)}</p>` : ''}
    </header>
    ${route.heroImage ? `<figure class="article-hero-image"><img src="${escape(route.heroImage)}" alt="${escape(imageAlt)}" ${imageHtmlAttributes(route.heroImage, { priority: true })} /></figure>` : ''}
    <section>${route.bodyHtml || ''}</section>
  </article><nav>${nav}</nav><footer>${socials}</footer>`
}

function buildGeneratedBlogFallback(route) {
  const article = mdToHtml(route.markdown || '')
  const nav = fallbackNav(route.lang)
  const socials = fallbackSocials()
  const imageAlt = route.imageAlt || route.title
  return `<article id="article-content" data-article-engine="article">
    <header>
      <h1>${escape(route.title)}</h1>
      ${route.description ? `<p>${escape(route.description)}</p>` : ''}
    </header>
    ${route.heroImage ? `<figure class="article-hero-image"><img src="${escape(route.heroImage)}" alt="${escape(imageAlt)}" ${imageHtmlAttributes(route.heroImage, { priority: true })} /></figure>` : ''}
    <section>${article}</section>
  </article><nav>${nav}</nav><footer>${socials}</footer>`
}

function getRouteMd(route) {
  if (route.markdown) return route.markdown.replace(/^#\s+[^\n]*\n+/, '')
  if (route.kind === 'generated-blog-post' || route.kind === 'generated-article-post' || route.kind === 'topic-page' || route.kind === 'article-page') {
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
  'ru-blog': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Блог — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/ru/blog/`,
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
  'ru-articles': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Статьи — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/ru/articles/`,
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
  'ru-articles-ai-tools-for-designers-design-engineering-agents': (r) => articleSchema(r, {
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
    articleSection: route.lang === 'en' ? 'Blog' : 'Блог',
  })
}

function generatedArticlePostSchema(route) {
  return articleSchema(route, {
    keywords: [route.primaryKeyword, ...(route.secondaryKeywords || [])].filter(Boolean),
    about: (route.tags || []).map((name) => ({ '@type': 'Thing', name })),
    articleSection: route.lang === 'en' ? 'Articles' : 'Статьи',
  })
}

function articlePageSchema(route) {
  return articleSchema(route, {
    dateModified: route.updatedAt ? `${route.updatedAt}T00:00:00+03:00` : STATIC_UPDATED_AT,
    articleSection: route.lang === 'en' ? 'Articles' : 'Статьи',
  })
}

const BREADCRUMBS_BY_SLUG = {
  'en': [['Home', `${SITE_URL}/`], ['English', `${SITE_URL}/en/`]],
  'en-blog': [['Home', `${SITE_URL}/en/`], ['Blog', `${SITE_URL}/en/blog/`]],
  'en-articles': [['Home', `${SITE_URL}/en/`], ['Articles', `${SITE_URL}/en/articles/`]],
  'en-about': [['Home', `${SITE_URL}/en/`], ['About', `${SITE_URL}/en/about/`]],
  'about': [['Главная', `${SITE_URL}/`], ['Обо мне', `${SITE_URL}/about/`]],
  'ru-blog': [['Главная', `${SITE_URL}/ru/`], ['Блог', `${SITE_URL}/ru/blog/`]],
  'ru-articles': [['Главная', `${SITE_URL}/ru/`], ['Статьи', `${SITE_URL}/ru/articles/`]],
  'articles-ai-tools-for-designers-design-engineering-agents': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['AI-инструменты для дизайнеров', `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`]],
  'ru-articles-ai-tools-for-designers-design-engineering-agents': [['Главная', `${SITE_URL}/ru/`], ['Статьи', `${SITE_URL}/ru/articles/`], ['AI-инструменты для дизайнеров', `${SITE_URL}/ru/articles/ai-tools-for-designers-design-engineering-agents/`]],
  'private-channel': [['Главная', `${SITE_URL}/`], ['Закрытый канал', `${SITE_URL}/private-channel/`]],
  'markdown-vs-html': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['Markdown vs HTML', `${SITE_URL}/articles/markdown-vs-html/`]],
  'privacy': [['Home', `${SITE_URL}/`], ['Privacy Policy', `${SITE_URL}/privacy/`]],
}

function buildBreadcrumb(route) {
  const items = route.kind === 'generated-blog-post'
    ? [[route.lang === 'en' ? 'Home' : 'Главная', `${SITE_URL}${route.lang === 'en' ? '/en/' : '/ru/'}`], [route.lang === 'en' ? 'Blog' : 'Блог', `${SITE_URL}${route.lang === 'en' ? '/en/blog/' : '/ru/blog/'}`], [route.title, `${SITE_URL}${route.path}/`]]
    : route.kind === 'generated-article-post'
      ? [[route.lang === 'en' ? 'Home' : 'Главная', `${SITE_URL}${route.lang === 'en' ? '/en/' : '/ru/'}`], [route.lang === 'en' ? 'Articles' : 'Статьи', `${SITE_URL}${route.lang === 'en' ? '/en/articles/' : '/ru/articles/'}`], [route.title, `${SITE_URL}${route.path}/`]]
    : route.kind === 'article-page'
      ? [[route.lang === 'en' ? 'Home' : 'Главная', `${SITE_URL}${route.lang === 'en' ? '/en/' : '/ru/'}`], [route.lang === 'en' ? 'Articles' : 'Статьи', `${SITE_URL}${route.lang === 'en' ? '/en/articles/' : '/ru/articles/'}`], [route.title, `${SITE_URL}${route.path}/`]]
    : route.kind === 'topic-page'
      ? [['Главная', `${SITE_URL}/ru/`], ['Темы', `${SITE_URL}/ru/articles/`], [route.topicTitle || route.title, `${SITE_URL}${route.path}/`]]
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
  const url = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}/`
  const mdHref = `/${slug}.md`
  const isNoindex = route.robots?.startsWith('noindex')
  const lang = route.lang || 'ru'
  const ogLocale = lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU'
  const articleRoute = isArticleRoute(route)
  const ogType = articleRoute ? 'article' : 'website'
  const image = route.image || 'https://github.com/ohld.png'
  const imageAlt = route.imageAlt || route.title || 'Даниил Охлопков'
  const twitterCard = route.heroImage ? 'summary_large_image' : 'summary'
  const escapedTitle = escape(title)
  const escapedDescription = escape(description)
  const escapedImageAlt = escape(imageAlt)
  const mdBody = getRouteMd(route)
  const fallback = route.kind === 'article-page'
    ? buildArticleFallback(route)
    : route.kind === 'generated-blog-post' || route.kind === 'generated-article-post'
      ? buildGeneratedBlogFallback(route)
      : mdBody ? buildFallback(title, mdBody, articleRoute, lang) : buildFallback(title, '', articleRoute, lang)
  let out = applySiteUrl(html)
    .replace(/<html lang="[^"]+">/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapedTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedDescription}${close}`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, `$1${route.robots || 'index, follow'}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedTitle}${close}`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedDescription}${close}`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${ogLocale}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedImageAlt}${close}`)
    .replace(/(<meta property="og:image:alt" content="[^"]*" \/>\n)/, `$1${ogImageStructuredMeta(route)}`)
    .replace(/(<meta name="twitter:card" content=")[^"]*(")/, `$1${twitterCard}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedTitle}${close}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedDescription}${close}`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, (_match, open, close) => `${open}${escapedImageAlt}${close}`)
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
    : route.kind === 'generated-article-post'
      ? generatedArticlePostSchema(route)
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
  const faq = faqSchema(route)
  if (faq) {
    const faqJson = jsonForHtml(faq)
    const block = `<script id="faq-structured-data" type="application/ld+json">\n${faqJson}\n</script>\n  </head>`
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
  if (route.kind === 'generated-blog-post' || route.kind === 'generated-article-post' || route.kind === 'topic-page' || route.kind === 'article-page') {
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
  { from: '/work-together', fromSlug: 'work-together', to: '/about/', toSlug: 'about' },
  { from: '/markdown-vs-html', fromSlug: 'markdown-vs-html-old', to: '/articles/markdown-vs-html/', toSlug: 'markdown-vs-html' },
  { from: '/posts', fromSlug: 'posts', to: '/ru/blog/', toSlug: 'ru-blog' },
  { from: '/ai-agents', fromSlug: 'ai-agents', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/ai-course', fromSlug: 'ai-course', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/blog/ai-tools-for-designers-design-engineering-agents', fromSlug: 'blog-ai-tools-for-designers-design-engineering-agents', to: '/ru/articles/ai-tools-for-designers-design-engineering-agents/', toSlug: 'ru-articles-ai-tools-for-designers-design-engineering-agents' },
  { from: '/blog/hermes-agent-vs-openclaw', fromSlug: 'blog-hermes-agent-vs-openclaw', to: '/ru/articles/hermes-agent-vs-openclaw/', toSlug: 'article-hermes-agent-vs-openclaw' },
  { from: '/author/okhlopkov', fromSlug: 'author-okhlopkov', to: '/about/', toSlug: 'about' },
  { from: '/projects', fromSlug: 'projects', to: '/about/', toSlug: 'about' },
  { from: '/tag/second-brain', fromSlug: 'tag-second-brain', to: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/', toSlug: 'vtoroj-mozg-ai-assistent-obsidian-claude-code' },
  { from: '/tag/ai-agents', fromSlug: 'tag-ai-agents', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/tag/telegram', fromSlug: 'tag-telegram', to: '/ru/blog/', toSlug: 'ru-blog' },
  { from: '/tag/ai', fromSlug: 'tag-ai', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/tag/analytics', fromSlug: 'tag-analytics', to: '/ru/blog/', toSlug: 'ru-blog' },
  { from: '/tag/claude-code', fromSlug: 'tag-claude-code', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/tag/crypto', fromSlug: 'tag-crypto', to: '/ru/blog/', toSlug: 'ru-blog' },
  { from: '/tag/dokku', fromSlug: 'tag-dokku', to: '/cloudflare-certificates-dokku/', toSlug: 'cloudflare-certificates-dokku' },
  { from: '/tag/parsing', fromSlug: 'tag-parsing', to: '/how-to-get-a-telegram-channel-subscribers-list-in-python/', toSlug: 'how-to-get-a-telegram-channel-subscribers-list-in-python' },
  { from: '/tag/telegram-cn', fromSlug: 'tag-telegram-cn', to: '/en/', toSlug: 'en' },
  { from: '/tag/telegram-en', fromSlug: 'tag-telegram-en', to: '/en/', toSlug: 'en' },
  { from: '/tag/web-scraping', fromSlug: 'tag-web-scraping', to: '/web-scraping-ai-agents-2026/', toSlug: 'web-scraping-ai-agents-2026' },
  { from: '/cn', fromSlug: 'cn', to: '/en/', toSlug: 'en' },
  { from: '/my-tg-bots', fromSlug: 'my-tg-bots', to: '/about/', toSlug: 'about' },
  { from: '/vibe-coding-guide-2026', fromSlug: 'vibe-coding-guide-2026', to: '/ru/articles/', toSlug: 'ru-articles' },
]
for (const post of GENERATED_BLOG_POSTS) {
  const to = `${generatedBlogPath(post)}/`
  const from = `/blog/${post.slug}`
  if (from !== to.replace(/\/+$/, '')) {
    REDIRECTS.push({
      from,
      fromSlug: `blog-${post.slug}-old`,
      to,
      toSlug: `blog-${post.slug}`,
    })
  }
}
for (const article of GENERATED_SEO_ARTICLES) {
  const to = `${generatedArticlePath(article)}/`
  const from = article.lang === 'en' ? `/articles/${article.slug}` : `/articles/${article.slug}`
  if (from !== to.replace(/\/+$/, '')) {
    REDIRECTS.push({
      from,
      fromSlug: `articles-${article.slug}-old`,
      to,
      toSlug: `article-${article.slug}`,
    })
  }
}
REDIRECTS.push(
  { from: '/blog', fromSlug: 'blog-old-index', to: '/ru/blog/', toSlug: 'ru-blog' },
  { from: '/articles', fromSlug: 'articles-old-index', to: '/ru/articles/', toSlug: 'ru-articles' },
  { from: '/articles/ai-tools-for-designers-design-engineering-agents', fromSlug: 'articles-ai-tools-for-designers-design-engineering-agents-old', to: '/ru/articles/ai-tools-for-designers-design-engineering-agents/', toSlug: 'ru-articles-ai-tools-for-designers-design-engineering-agents' },
)

for (const redirect of LEGACY_REDIRECTS) {
  const from = redirect.from.replace(/\/+$/, '')
  const to = redirect.to.endsWith('/') ? redirect.to : `${redirect.to}/`
  REDIRECTS.push({
    from,
    fromSlug: from.replace(/^\/+/, '').replace(/\/+/g, '-'),
    to,
    toSlug: to.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '-') || 'home',
  })
}
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
const BUNDLE_SLUGS = [...new Set(
  ROUTES
    .filter((route) => !route.robots?.startsWith('noindex'))
    .map((route) => route.slug)
    .filter((slug) => fs.existsSync(path.join(dist, `${slug}.md`))),
)]
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

# Content usage policy for crawlers that honor Content-Signal.
Content-Signal: ai-input=yes
Content-Signal: ai-train=no

Sitemap: ${SITE_URL}/sitemap.xml
`)

// ---- Minimal XML sitemap for Google Search Console ----
const SITEMAP_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/en/`,
  `${SITE_URL}/about/`,
  `${SITE_URL}/en/about/`,
  `${SITE_URL}/ru/`,
  `${SITE_URL}/ru/blog/`,
  `${SITE_URL}/en/blog/`,
  `${SITE_URL}/ru/articles/`,
  `${SITE_URL}/en/articles/`,
  `${SITE_URL}/ru/articles/ai-tools-for-designers-design-engineering-agents/`,
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
  addSitemapUrl(`${generatedBlogPath(post)}/`, post.updatedAt || STATIC_UPDATED_DATE)
}
for (const article of GENERATED_SEO_ARTICLES) {
  addSitemapUrl(`${generatedArticlePath(article)}/`, article.updatedAt || STATIC_UPDATED_DATE)
}
for (const [slug] of TOPIC_PAGES) {
  addSitemapUrl(`/topics/${slug}/`)
}
for (const article of IMPORTED_ARTICLES) {
  if (article.path) addSitemapUrl(article.path, article.updatedAt || STATIC_UPDATED_DATE)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_URLS.map(sitemapUrlXml).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
console.log(`✓ Sitemap: generated ${SITEMAP_URLS.length} canonical URLs`)

console.log(`✓ Prerendered ${htmlCount} HTML routes + ${mdCount} Markdown files + ${redirectCount} redirects + ${IMPORTED_ARTICLES.length} imported articles + llms-full.txt`)
