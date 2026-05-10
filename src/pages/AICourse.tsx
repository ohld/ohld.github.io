import { BackButton } from '../components/BackButton'
import { CourseEntryCard } from '../components/CourseEntryCard'
import { Footer } from '../components/Footer'
import { ArrowRightIcon, ArrowRightUpIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { trackShare } from '../analytics'
import { useDocumentMeta } from '../useDocumentMeta'

const SHARE_URL = 'https://t.me/ohldbot/ooo'
const SHARE_TEXT = 'Бесплатный курс по AI-агентам от @danokhlopkov'

function handleShare() {
  trackShare()
  const shareLink = `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`
  if (window.__IS_TMA__ && window.Telegram?.WebApp) {
    // In TMA: use Telegram's native share sheet
    window.Telegram.WebApp.openTelegramLink(shareLink)
  } else if (navigator.share) {
    navigator.share({ title: SHARE_TEXT, url: SHARE_URL }).catch(() => {})
  } else {
    window.open(shareLink, '_blank')
  }
}

interface CourseEntry {
  postId: number
  quote: string
  context?: string
  link: string
  internal?: boolean
}

interface TwitterEntry {
  handle: string
  description: string
  link: string
}

interface Subsection {
  id: string
  title: string
  entries: CourseEntry[]
}

interface Section {
  id: string
  title: string
  entries?: CourseEntry[]
  subsections?: Subsection[]
  twitter?: TwitterEntry[]
}

const sections: Section[] = [
  {
    id: 'transformation',
    title: 'Жизнь до и после',
    entries: [
      { postId: 1582, quote: 'Это не AI заберет твою работу — это будет твой коллега с AI', context: 'Пост, с которого тысячи людей пошли пробовать', link: 'https://t.me/danokhlopkov/1582' },
      { postId: 1586, quote: 'Once you try Claude Code, you never go back', context: 'CC автоматизирует все, что можно сделать на компе. Уметь прогать не надо', link: 'https://t.me/danokhlopkov/1586' },
      { postId: 1581, quote: 'БУМ, игра готова ваншотом (почти)', context: 'Plan mode, $20 vs $100, тип от создателя Claude Code', link: 'https://t.me/danokhlopkov/1581' },
      { postId: 1585, quote: 'Всё, я в 2030. Теперь чисто голосовухами двигаюсь', context: 'Claude Code + Obsidian + голосовой ввод', link: 'https://t.me/danokhlopkov/1585' },
      { postId: 1582, quote: 'Сейчас идея и есть исполнение', context: '70% всего можно запрогать с нуля бесплатно', link: 'https://t.me/danokhlopkov/1582' },
      { postId: 1654, quote: 'Я в отпуск — AI-агенты работают за меня', context: 'Лайвстрим: как засетапил gstack + paperclip и уехал на яхты', link: 'https://t.me/danokhlopkov/1654' },
      { postId: 1660, quote: 'Не обновлял свой AI-сетап 2 недели — опоздал', context: 'Каждый день выходит новое — фомо после отпуска', link: 'https://t.me/danokhlopkov/1660' },
      { postId: 0, quote: 'Подкаст #1: AI-сетап с @og_mishgun', context: 'YouTube — инструменты, которые реально используем', link: 'https://www.youtube.com/watch?v=yJuzI2u-AnM' },
      { postId: 0, quote: 'Подкаст #2: Self-hosted AI с @technotears', context: 'YouTube — приватность, self-hosted и Doom голосом', link: 'https://www.youtube.com/watch?v=Fxw6IQuL36o' },
      { postId: 0, quote: 'Видео: AI-агенты ведут проект, пока я в отпуске', context: 'YouTube — реальный сетап с Claude Code, Paperclip, gstack', link: 'https://youtu.be/E3P0a03mN8A' },
    ],
  },
  {
    id: 'getting-started',
    title: 'Как начать',
    entries: [
      { postId: 1561, quote: 'Вайб-кодинг: почему текстовый интерфейс, как брифовать агента', context: 'Полный гайд для начинающих', link: 'https://t.me/danokhlopkov/1561' },
      { postId: 1304, quote: 'Факты с источниками — погружаешься в любую тему бесконечно глубоко', context: 'Perplexity — первый шаг к AI-инструментам', link: 'https://t.me/danokhlopkov/1304' },
      { postId: 1364, quote: 'Запустил Ламу локально — бесплатно, 4.5GB, без интернета', context: 'Свой LLM на ноуте — Alt-Tab вместо Google', link: 'https://t.me/danokhlopkov/1364' },
      { postId: 1587, quote: 'Как устроены AI-агенты и как с ними норм прогать', context: 'Разбор на пальцах — лонгрид на Хабре', link: 'https://habr.com/ru/articles/987382/' },
      { postId: 1496, quote: 'Single prompt vs prompt chain vs agent', context: 'Кураторский список инструментов для старта', link: 'https://t.me/danokhlopkov/1496' },
      { postId: 1586, quote: 'Сначала сделай хорошо себе: автоматизируй рутинку', context: 'Совет коллеге — через неделю результат заметен всем', link: 'https://t.me/danokhlopkov/1586' },
    ],
  },
  {
    id: 'practice',
    title: 'Практика и кейсы',
    subsections: [
      {
        id: 'practice-workflow',
        title: 'Методология',
        entries: [
          { postId: 1583, quote: 'ОТКРЫВАЕШЬ НОВЫЙ ЧАТ — никакого context rot', context: 'Полный флоу: идея → спека → plan mode → execute', link: 'https://t.me/danokhlopkov/1583' },
          { postId: 1504, quote: 'Скетч → прототип → спецификация', context: 'Как прогать новый проект с LLM', link: 'https://t.me/danokhlopkov/1504' },
          { postId: 1610, quote: 'Git worktrees: 3-5 параллельных сессий одновременно', context: 'Типсы от создателя CC + self-improving CLAUDE.md', link: 'https://t.me/danokhlopkov/1610' },
          { postId: 1612, quote: 'Задавай наводящие вопросы. Не останавливайся. Покажи, не рассказывай', context: 'Промпты для AI-агентов + playground skill', link: 'https://t.me/danokhlopkov/1612' },
          { postId: 0, quote: 'Markdown мёртв — да здравствует HTML', context: 'Почему HTML побеждает .md как формат вывода для AI. Перевод поста Tariq из команды Claude Code', link: '/markdown-vs-html', internal: true },
        ],
      },
      {
        id: 'practice-assistant',
        title: 'Личный ассистент',
        entries: [
          { postId: 1589, quote: 'Второй мозг — личная база знаний, которой можно задавать вопросы', context: 'Obsidian + CLAUDE.md', link: 'https://t.me/danokhlopkov/1589' },
          { postId: 1591, quote: 'Как сделать личного AI-ассистента дома', context: 'Пошаговая инструкция — лонгрид на VC.ru', link: 'https://vc.ru/id505848/2703538-lichnyj-ai-assistent-claude-code' },
          { postId: 1585, quote: 'Агент сам ведёт дневник и экономит часы', context: 'Claude Code + Obsidian + takopi', link: 'https://t.me/danokhlopkov/1585' },
        ],
      },
      {
        id: 'practice-work',
        title: 'Автоматизация работы',
        entries: [
          { postId: 1588, quote: 'Дал DATABASE_URL — через 7 минут присылается файл с метриками', context: 'Агент сам считает продуктовые метрики', link: 'https://t.me/danokhlopkov/1588' },
          { postId: 1621, quote: '7 шагов: собираем AI-аналитика', context: 'Увольняем джуниора — лонгрид на Хабре', link: 'https://habr.com/ru/articles/996958/' },
          { postId: 1606, quote: 'Собрал доки, библиотеки и best practices в одном месте', context: 'llms-txt — чтобы агент понимал твой продукт', link: 'https://t.me/danokhlopkov/1606' },
          { postId: 1634, quote: 'DaVinci Resolve + Claude = монтаж подкастов с AI', context: 'Scripting API + AppleScript + whisper для субтитров', link: 'https://t.me/danokhlopkov/1634' },
          { postId: 1652, quote: 'Claude + telegram-mcp забанил 3000 ботов после конкурса', context: 'Реальный кейс — за вечер вайбкодом', link: 'https://t.me/danokhlopkov/1652' },
          { postId: 1659, quote: 'Отпуск закончился — баги фиксились, блог вёлся', context: 'Что работало и что нет: sentry → CTO → PR → ревью → деплой', link: 'https://t.me/danokhlopkov/1659' },
        ],
      },
      {
        id: 'practice-extend',
        title: 'Прокачка агента',
        entries: [
          { postId: 1607, quote: 'Полезные скиллы и MCP — agent-browser, coolify', context: 'Быстрый способ прокачать агента без кода', link: 'https://t.me/danokhlopkov/1607' },
          { postId: 1616, quote: '7 ошибок при написании скиллов', context: 'Триггеры, имена, формат — чтобы агент не тупил', link: 'https://t.me/danokhlopkov/1616' },
          { postId: 1626, quote: 'Claude + Codex: Dual Review — моих правок становится меньше', context: 'Два AI ревьюят друг друга', link: 'https://t.me/danokhlopkov/1626' },
          { postId: 1628, quote: '21 неудобный вопрос для агента', context: 'Диагностические вопросы — превращают агента в инструмент', link: 'https://t.me/danokhlopkov/1628' },
          { postId: 1636, quote: 'Скорми фреймворк агенту и спроси «есть полезное?»', context: 'Как фильтровать Twitter-хайп — 90% не нужно', link: 'https://t.me/danokhlopkov/1636' },
          { postId: 1637, quote: 'Paperclip: визуальный трекер задач для агентов', context: 'Ты — board member, нанимаешь CEO, он нанимает сотрудников', link: 'https://t.me/danokhlopkov/1637' },
          { postId: 1641, quote: 'Обзор AI-инструментов марта: paperclip, gstack, x402', context: 'Что попробовал, что осталось, что выкинул', link: 'https://t.me/danokhlopkov/1641' },
          { postId: 1622, quote: 'Будьте аккуратны скачивая программы', context: 'Безопасность: фейковые установщики Claude Code', link: 'https://t.me/danokhlopkov/1622' },
        ],
      },
    ],
  },
  {
    id: 'future',
    title: 'Мысли о будущем',
    entries: [
      { postId: 1629, quote: '3 профессии: менеджер агентов, системщик, доменный переводчик', context: 'Единица работы — токен, купленный интеллект', link: 'https://t.me/danokhlopkov/1629' },
      { postId: 1611, quote: 'MVP собирается за выходные вайбкодингом', context: 'Где найти идею для SaaS — acquire.com метод', link: 'https://t.me/danokhlopkov/1611' },
      { postId: 1524, quote: 'Джуны RIP', context: 'Как меняется рынок труда', link: 'https://t.me/danokhlopkov/1524' },
      { postId: 1608, quote: 'AI-агенты придумали свою религию', context: 'Чат AI-агентов — комьюнити как ускоритель', link: 'https://t.me/danokhlopkov/1608' },
      { postId: 1639, quote: '183 AI-бота в Telegram: 44.3M MAU', context: 'Исследование — TG стал дефолтным интерфейсом для AI', link: 'https://t.me/danokhlopkov/1639' },
      { postId: 1644, quote: 'Продукты → Facebook → TikTok → ChatGPT', context: 'Эскалация внимания — RLHF двигает продуктовые метрики', link: 'https://t.me/danokhlopkov/1644' },
      { postId: 1645, quote: 'Не стань хикки-вайбкодером', context: 'Команда с видением > один человек с агентами', link: 'https://t.me/danokhlopkov/1645' },
      { postId: 1655, quote: 'Telegram должен разрешить ботам писать друг другу', context: 'A2A через TG: discovery, маркетплейс агентов, крипто-платежи', link: 'https://t.me/danokhlopkov/1655' },
    ],
  },
  {
    id: 'twitter',
    title: 'Кого читать',
    twitter: [
      { handle: '@karpathy', description: 'Топ AI папик из OpenAI, Tesla и Стенфорда', link: 'https://x.com/karpathy' },
      { handle: '@levelsio', description: 'Билд ин паблик + солопренер + номад + вайбкодер', link: 'https://x.com/levelsio' },
      { handle: '@bcherny', description: 'Папка Claude Code', link: 'https://x.com/bcherny' },
      { handle: '@trq212', description: 'Пишет апдейты по Claude Code первым', link: 'https://x.com/trq212' },
      { handle: '@banteg', description: 'Создатель takopi', link: 'https://x.com/banteg' },
      { handle: '@GeoffreyHuntley', description: 'Изобретатель Ralph Loop', link: 'https://x.com/GeoffreyHuntley' },
      { handle: '@insuline_eth', description: 'DeFi разраб, давно познавший агентов', link: 'https://t.me/insuline_eth' },
      { handle: '@og_mishgun', description: 'Инди-хакер, солопренер, web3', link: 'https://t.me/og_mishgun' },
    ],
  },
]

export function AICourse() {
  useDocumentMeta({
    title: 'AI Agents курс — Даниил Охлопков',
    description: 'Бесплатный курс по AI-агентам на основе моих публикаций. Claude Code, MCP, vibe-coding, реальные кейсы.',
    canonical: 'https://ohld.github.io/ai-course/',
  })
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">AI Agents</h1>
        <p className="subpage-subtitle">
          Бесплатный курс. Каждая карточка — ключевая мысль из поста. Жми — читай оригинал.
        </p>
      </div>

      {/* TOC */}
      <div className="section-label">
        <span>Оглавление</span>
        <div className="section-label-line" />
      </div>
      <div className="course-section">
        {sections.map((s) => (
          <button
            key={s.id}
            className="toc-row"
            onClick={() => scrollTo(s.id)}
          >
            {s.title}
            <ArrowRightIcon size={16} style={{ opacity: 0.3 }} />
          </button>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} id={section.id}>
          <div className="section-label">
            <span>{section.title}</span>
            <div className="section-label-line" />
          </div>

          {/* Flat entries */}
          {section.entries && (
            <div className="course-section">
              {section.entries.map((entry, i) => (
                <CourseEntryCard
                  key={`${entry.postId}-${i}`}
                  quote={entry.quote}
                  context={entry.context}
                  link={entry.link}
                  internal={entry.internal}
                />
              ))}
            </div>
          )}

          {/* Share button after "Как начать" */}
          {section.id === 'getting-started' && (
            <button className="cta-btn" onClick={handleShare} style={{ marginBottom: 0 }}>
              <span>Отправить этот гайд</span>
              <ArrowRightUpIcon size={20} />
            </button>
          )}

          {/* Subsections — each in its own bordered box */}
          {section.subsections?.map((sub) => (
            <div key={sub.id} id={sub.id}>
              <div className="subsection-label">{sub.title}</div>
              <div className="course-section">
                {sub.entries.map((entry, i) => (
                  <CourseEntryCard
                    key={`${entry.postId}-${i}`}
                    quote={entry.quote}
                    context={entry.context}
                    link={entry.link}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Share button before "Кого читать" */}
          {section.twitter && (
            <button className="cta-btn" onClick={handleShare} style={{ marginBottom: 0 }}>
              <span>Отправить этот гайд</span>
              <ArrowRightUpIcon size={20} />
            </button>
          )}

          {/* Twitter list */}
          {section.twitter && (
            <div className="twitter-section">
              {section.twitter.map((t) => (
                <div
                  key={t.handle}
                  className="twitter-entry"
                  onClick={() => openUrl(t.link, 'twitter', t.handle)}
                  role="link"
                >
                  <div className="twitter-entry-info">
                    <span className="twitter-entry-handle">{t.handle}</span>
                    <span className="twitter-entry-desc">{t.description}</span>
                  </div>
                  <ArrowRightUpIcon size={16} style={{ opacity: 0.3 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* CTA */}
      <div
        className="cta-btn"
        onClick={() => openUrl('https://t.me/+4RC6ScUJArk3YTFi', 'cta', 'ask_in_chat')}
        role="link"
      >
        <span>Задать вопрос в чате</span>
        <ArrowRightUpIcon size={20} />
      </div>

      <Footer />
    </div>
  )
}
