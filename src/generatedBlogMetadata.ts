interface BlogListItem {
  path: string
  title: string
  description: string
  publishedAt: string
  readingTime: string
  tags: string[]
  thumbnail?: string
}

export interface GeneratedPostMeta {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  lang: string
  readingTime: string
  tags: string[]
  coverImage?: string
  coverAlt?: string
  thumbnailImage?: string
}

const generatedBlogPostMeta: GeneratedPostMeta[] = [
  {
    slug: 'ai-agents-s-chego-nachat',
    title: 'AI-агенты: с чего начать в 2026 — карта материалов, Claude Code, Codex и живые кейсы',
    description: 'Маршрут по материалам Дана Охлопкова про AI-агентов: Claude Code, Codex, промпты, Obsidian, Paperclip, реальные стримы и что читать первым.',
    publishedAt: '2026-05-05',
    updatedAt: '2026-07-07',
    lang: 'ru',
    readingTime: '10 мин',
    tags: ['AI Agents', 'Claude Code', 'Codex'],
    coverImage: '/assets/blog/ai-agents-s-chego-nachat/ai-agents-playlist-meme.webp',
    coverAlt: 'Мем-картинка про плейлист AI-агентов',
  },
  {
    slug: 'ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain',
    title: 'AI-трансформация в компании: общий контекст, skills и GBrain вместо хаоса на ноутбуках',
    description: 'Почему корпоративной AI-трансформации нужны общий контекст, обновляемые skills, GBrain/OpenBrain, TencentDB Agent Memory и роль библиотекаря контекста.',
    publishedAt: '2026-05-24',
    updatedAt: '2026-05-31',
    lang: 'ru',
    readingTime: '8 мин',
    tags: ['AI Transformation', 'GBrain', 'Skills'],
    coverImage: '/assets/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/company-context-cover.webp',
    coverAlt: 'Мем-обложка про общий контекст, skills, GBrain и AI-агентов',
  },
  {
    slug: 'business-on-ai-agent-claude-code-paperclip-gstack',
    title: 'AI-агенты ведут проект, пока я в отпуске: Claude Code, Paperclip и GStack без магии',
    description: 'Как я настроил AI-агентов на проект, что сработало во время отпуска, что сломалось и какой workflow нужен, чтобы агент не просто менял код туда-сюда.',
    publishedAt: '2026-05-26',
    updatedAt: '2026-06-01',
    lang: 'ru',
    readingTime: '10 мин',
    tags: ['AI Agents', 'GStack', 'Claude Code'],
    coverImage: '/assets/blog/business-on-ai-agent-claude-code-paperclip-gstack/business-agents-cover.webp',
    coverAlt: 'Мем-обложка про Sentry, фикс и ревью, пока автор в отпуске',
  },
  {
    slug: 'claude-code-vs-codex-perehod',
    title: 'Claude Code или Codex: что выбрать для вайбкодинга и агентной разработки',
    description: 'Decision page: когда выбирать Claude Code, когда Codex, как делить роли между агентами, что делать с контекстом, MCP, skills, ревью и долгими задачами.',
    publishedAt: '2026-05-14',
    updatedAt: '2026-07-07',
    lang: 'ru',
    readingTime: '15 мин',
    tags: ['Claude Code', 'Codex', 'AI Coding'],
    coverImage: '/assets/blog/claude-code-vs-codex-perehod/telegram-cover.webp',
    coverAlt: 'Скриншот из Telegram-поста про переход с Claude Code на Codex',
  },
  {
    slug: 'gstack-goal-office-hours-ai-workflow',
    title: 'GStack, /goal и office hours: рабочий цикл для AI-агента без бесконечной простыни текста',
    description: 'Как связать office-hours, improve-codebase-architecture, Codex /goal и HTML-progress в нормальный цикл работы с AI-агентом.',
    publishedAt: '2026-05-21',
    updatedAt: '2026-05-26',
    lang: 'ru',
    readingTime: '6 мин',
    tags: ['GStack', 'Codex', 'Claude Code'],
    coverImage: '/assets/blog/gstack-goal-office-hours-ai-workflow/telegram-cover.webp',
    coverAlt: 'Скриншот из Telegram-поста про GStack, /goal и office hours',
  },
  {
    slug: 'improve-codebase-architecture-prompt',
    title: 'Claude Code skills для рефакторинга: что дать AI-агенту, когда задачи закончились',
    description: 'Два сильных skill для Claude Code и Cursor: improve-codebase-architecture и Thermo-Nuclear Code Quality Review. Как заставить агента искать архитектурный долг, а не косметический cleanup.',
    publishedAt: '2026-05-01',
    updatedAt: '2026-05-31',
    lang: 'ru',
    readingTime: '5 мин',
    tags: ['AI Agents', 'Refactoring', 'Skills'],
    coverImage: '/assets/blog/improve-codebase-architecture-prompt/architecture-prompt-cover.webp',
    coverAlt: 'Мем-обложка про улучшение архитектуры AI-агентом без поломки продакшена',
  },
  {
    slug: 'my-ai-setup-2026-claude-code-cursor-spokenly-ghostty',
    title: 'Мой AI-сетап 2026: Claude Code, Cursor, Ghostty, Spokenly и база всех чатов',
    description: 'Практический AI setup из стрима с @og_mishgun: что реально ускоряет работу, зачем Ghostty, Spokenly, OwnYourChat и Descript, и как не утонуть в инструментах.',
    publishedAt: '2026-05-26',
    updatedAt: '2026-05-26',
    lang: 'ru',
    readingTime: '8 мин',
    tags: ['AI Tools', 'Claude Code', 'Productivity'],
    coverImage: '/assets/blog/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty/phone-agent-meme.webp',
    coverAlt: 'Мем-картинка про общение с AI-агентом с телефона',
  },
  {
    slug: 'vibecoding-telegram-mini-app-claude-code',
    title: 'Telegram Mini App с Claude Code: llms.txt, крестики-нолики и деплой без чтения доков',
    description: 'Как я собрал source pack для Telegram Mini Apps, сделал llms.txt, сгенерил TMA с Claude Code и задеплоил игру. Чеклист, что ломается чаще всего.',
    publishedAt: '2026-05-26',
    updatedAt: '2026-05-26',
    lang: 'ru',
    readingTime: '9 мин',
    tags: ['Telegram Mini Apps', 'Claude Code', 'Vibe Coding'],
    coverImage: '/assets/blog/vibecoding-telegram-mini-app-claude-code/tma-llms-cover.webp',
    coverAlt: 'Мем-обложка про llms.txt для Telegram Mini App и AI-агента, который сам читает документацию',
  },
]

const generatedArticlePostMeta: GeneratedPostMeta[] = [
  {
    slug: 'ai-reels-seo-pipeline-telegram-claude-code',
    title: 'AI-рилзы для SEO: как собрать video pipeline из Telegram-трендов',
    description: 'Пайплайн AI-рилзов для SEO: Telegram/X трендвотчинг, быстрые видео-эксперименты, метрики saves/shares и превращение победителей в evergreen-страницы.',
    publishedAt: '2026-05-27',
    updatedAt: '2026-05-27',
    lang: 'ru',
    readingTime: '6 мин',
    tags: ['AI Agents', 'Telegram', 'Claude Code', 'Workflow', 'GBrain'],
    coverImage: '/assets/articles/ai-reels-seo-pipeline-telegram-claude-code/reels-seo-cover.webp',
    coverAlt: 'Мем-обложка с подписью Прости, я AI-рилз, меня собрали по метрикам',
  },
  {
    slug: 'gde-deshevle-kupit-telegram-stars',
    title: 'Где дешевле купить Telegram Stars: боты, Split, Fragment и СБП',
    description: 'Сравнил цены Telegram Stars у Split, StarsZakup, STARSEi, BuynStars и ботов: СБП, карты, крипта, рефки и риски. Срез на 3 июня 2026.',
    publishedAt: '2026-06-03',
    updatedAt: '2026-06-03',
    lang: 'ru',
    readingTime: '10 мин',
    tags: ['Telegram Stars', 'Telegram', 'TON', 'Fragment', 'SEO'],
    coverImage: '/assets/articles/gde-deshevle-kupit-telegram-stars/telegram-stars-cover.webp',
    coverAlt: 'Мемная обложка к сравнению сервисов, где дешевле купить Telegram Stars через СБП, карты и крипту',
    thumbnailImage: '/assets/articles/gde-deshevle-kupit-telegram-stars/telegram-stars-cover-card.webp',
  },
  {
    slug: 'ai-agent-v-telegram-rabochiy-interfeis',
    title: 'AI-агент в Telegram: где заканчивается бот и начинается рабочий интерфейс',
    description: 'Чем AI-агент в Telegram отличается от обычного бота: память, tools, MCP, cron, профили, безопасность, UX и сценарии, где Telegram становится рабочим интерфейсом.',
    publishedAt: '2026-07-07',
    updatedAt: '2026-07-07',
    lang: 'ru',
    readingTime: '13 мин',
    tags: ['AI Agents', 'Telegram Automation', 'Hermes Agent', 'MCP', 'GBrain'],
  },
  {
    slug: 'hermes-agent-vs-openclaw',
    title: 'Hermes Agent vs OpenClaw: что выбрать для AI-агента',
    description: 'Практическое сравнение Hermes Agent и OpenClaw: Telegram, установка, память, skills, MCP, cron, безопасность, токены и сценарии для self-hosted AI-агента.',
    publishedAt: '2026-05-28',
    updatedAt: '2026-05-28',
    lang: 'ru',
    readingTime: '14 мин',
    tags: ['AI Agents', 'Hermes Agent', 'OpenClaw', 'Telegram Automation', 'MCP'],
    coverImage: '/assets/articles/hermes-agent-vs-openclaw/hermes-openclaw-cover.webp',
    coverAlt: 'Мем-обложка Hermes vs OpenClaw про day-30 тест AI-агента',
  },
  {
    slug: 'kak-pravilno-pisat-skilly-claude-code-7-oshibok',
    title: 'Claude Code skills: 7 ошибок в SKILL.md',
    description: 'Как писать Claude Code skills без prompt soup: триггер, границы, output format, supporting files, tests/evals и skill pack, который агент реально вызывает.',
    publishedAt: '2026-02-10',
    updatedAt: '2026-06-02',
    lang: 'ru',
    readingTime: '15 мин',
    tags: ['AI Agents', 'Claude Code', 'Skills', 'MCP'],
    coverImage: '/assets/articles/kak-pravilno-pisat-skilly-claude-code-7-oshibok/claude-code-skills-cover.webp',
    coverAlt: 'Мем-обложка SKILL.md / NOT PROMPT SOUP для статьи про Claude Code skills',
  },
]

function byNewest(a: GeneratedPostMeta, b: GeneratedPostMeta) {
  return b.publishedAt.localeCompare(a.publishedAt)
}

function toListItem(post: GeneratedPostMeta, path: string): BlogListItem {
  return {
    path,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    tags: post.tags,
    thumbnail: post.thumbnailImage || post.coverImage,
  }
}

export const generatedBlogMeta = [...generatedBlogPostMeta].sort(byNewest)
export const generatedArticleMeta = [...generatedArticlePostMeta].sort(byNewest)

export function generatedBlogPath(slug: string, lang = 'ru') {
  return lang === 'en' ? `/en/blog/${slug}/` : `/ru/blog/${slug}/`
}

export function generatedArticlePath(slug: string, lang = 'ru') {
  return lang === 'en' ? `/en/articles/${slug}/` : `/ru/articles/${slug}/`
}

export const generatedEnglishBlogItems: BlogListItem[] = generatedBlogMeta
  .filter((post) => post.lang === 'en')
  .map((post) => toListItem(post, generatedBlogPath(post.slug, post.lang)))

export const generatedRussianBlogItems: BlogListItem[] = generatedBlogMeta
  .filter((post) => post.lang !== 'en')
  .map((post) => toListItem(post, generatedBlogPath(post.slug, post.lang)))

export const generatedEnglishArticleItems: BlogListItem[] = generatedArticleMeta
  .filter((post) => post.lang === 'en')
  .map((post) => toListItem(post, generatedArticlePath(post.slug, post.lang)))

export const generatedRussianArticleItems: BlogListItem[] = generatedArticleMeta
  .filter((post) => post.lang !== 'en')
  .map((post) => toListItem(post, generatedArticlePath(post.slug, post.lang)))
