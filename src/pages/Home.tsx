import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { trackNav } from '../analytics'
import { absoluteUrl, SITE_DESCRIPTION } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { russianArticleItems, russianBlogItems } from '../blog'
import { topicPath } from '../topics'

const navItems = [
  { path: '/blog', title: 'Блог', subtitle: 'Записи и рабочие заметки', items: russianBlogItems.slice(0, 3) },
  { path: '/articles', title: 'Статьи', subtitle: 'Гайды, сравнения и туториалы', badge: 'NEW', items: russianArticleItems.slice(0, 2) },
  { path: '/about', title: 'Обо мне', subtitle: 'Бэкграунд, опыт и ссылки' },
]

export function Home() {
  const navigate = useNavigate()
  useDocumentMeta({
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: SITE_DESCRIPTION,
    canonical: absoluteUrl('/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Даниил<br />Охлопков</h1>
        <div className="page-header-handle">
          <span className="page-header-dot" />
          <span className="page-header-mono">@danokhlopkov</span>
        </div>
        <p className="page-header-bio">
          Практика <a href={topicPath('ai-agents')}>AI-агентов</a>: <a href={topicPath('codex')}>Codex</a>, <a href={topicPath('claude-code')}>Claude Code</a>, <a href={topicPath('mcp')}>MCP</a>, <a href={topicPath('gstack')}>GStack</a>, <a href={topicPath('openclaw')}>OpenClaw</a>, <a href={topicPath('ton-data')}>TON-данные</a> и <a href={topicPath('telegram-automation')}>Telegram-автоматизация</a>.
        </p>
      </header>

      <main className="home-sections" aria-label="Основные разделы">
        {navItems.map((item) => (
          <section className="home-route-panel" key={item.path}>
            <button
              type="button"
              className="nav-row"
              onClick={() => { trackNav(item.path); navigate(item.path) }}
            >
              <div className="nav-row-content">
                <span className="nav-row-title">{item.title}</span>
                <span className="nav-row-subtitle">{item.subtitle}</span>
              </div>
              <div className="nav-row-right">
                {item.badge && <span className="nav-row-badge">{item.badge}</span>}
              </div>
            </button>
            {item.items && (
              <div className="home-card-list">
                {item.items.map((entry) => (
                  <a className="home-list-link" href={entry.path} key={entry.path}>
                    <span>{entry.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      <section className="home-section home-seo-section" aria-labelledby="home-start">
        <h2 id="home-start">Если вы настраиваете AI-агентов</h2>
        <p>
          Начните с <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">моего Claude Code setup</a>:
          там собраны MCP-серверы, hooks, skills, subagents и правила, которые
          пережили несколько месяцев ежедневной работы. Если агент начинает
          забывать контекст, откройте разбор <a href="/claude-code-compaction-kak-rabotaet/">Claude Code compaction</a>.
          Если нужно понять, когда брать Codex, а когда Claude Code, смотрите
          <a href="/blog/claude-code-vs-codex-perehod/">переход на Codex</a>.
        </p>
        <p>
          Рабочая схема простая: <code>AGENTS.md</code> или <code>CLAUDE.md</code> держит
          постоянные правила проекта, skills хранят повторяемые процедуры, MCP
          подключает живые данные и внешние инструменты, hooks ловят опасные
          действия, subagents выносят ресёрч и ревью в отдельный контекст. Всё
          остальное обычно превращается в длинный промпт, который агент всё
          равно забудет.
        </p>
      </section>

      <section className="home-section home-seo-section" aria-labelledby="home-practical">
        <h2 id="home-practical">Практические входы</h2>
        <ul className="home-seo-list">
          <li><a href="/web-scraping-ai-agents-2026/">Web scraping AI agents</a> — когда браузерный агент лучше старого парсера.</li>
          <li><a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">Second brain + Obsidian</a> — как хранить сырьё, решения и память проекта.</li>
          <li><a href="/luchshie-skills-mcp-claude-code-agent-browser/">Skills и MCP для Claude Code</a> — что ставить, а что не усложнять.</li>
          <li><a href="/articles/ai-tools-for-designers-design-engineering-agents/">AI-инструменты для дизайнеров</a> — design engineering без generic UI-slop.</li>
          <li><a href="/blog/gstack-goal-office-hours-ai-workflow/">GStack, goal и office hours</a> — как вести длинную agent-задачу до результата.</li>
        </ul>
      </section>

      <section className="home-section home-seo-section" aria-labelledby="home-map">
        <h2 id="home-map">Карта терминов без маркетинга</h2>
        <ul className="home-seo-list">
          <li><strong>Project rules</strong> — инварианты репозитория: стиль, запреты, команды проверки, где лежат данные.</li>
          <li><strong>Skills</strong> — короткие воспроизводимые процедуры: audit, ship, review, scrape, deploy.</li>
          <li><strong>MCP</strong> — доступ к живым системам: браузер, GBrain, GitHub, аналитика, документы, внешние API.</li>
          <li><strong>Hooks</strong> — автоматические стопперы перед опасными командами, секретами и случайным деплоем.</li>
          <li><strong>Subagents</strong> — отдельный контекст для ресёрча, QA и независимого ревью, чтобы не засорять основную задачу.</li>
        </ul>
      </section>

      <section className="home-section home-seo-section" aria-labelledby="home-metrics">
        <h2 id="home-metrics">Как я понимаю, что статья зашла</h2>
        <p>
          Один просмотр почти ничего не значит. Нормальный сигнал появляется,
          когда поисковый запрос, поведение на странице и следующее действие
          складываются в одну картину. Поэтому для статей я смотрю не только
          трафик, но и глубину чтения, клики по внутренним ссылкам, копирование
          кода, переходы к инструментам и возвраты к связанным материалам.
        </p>
        <ul className="home-seo-list">
          <li>Есть показы, но слабый CTR — переписать title, description и первый экран.</li>
          <li>Есть клики, но нет глубины чтения — убрать длинный заход и поднять примеры выше.</li>
          <li>Читают до конца, но не переходят дальше — добавить cluster links и понятный следующий шаг.</li>
          <li>Копируют код или открывают внешние инструменты — тему стоит расширять отдельной статьёй.</li>
        </ul>
      </section>

      <section className="home-section home-seo-section" aria-labelledby="home-seo-audit">
        <h2 id="home-seo-audit">Мини-план после SEO-аудита</h2>
        <ul className="home-seo-list">
          <li>Alt у картинок должен описывать изображение или брать смысл из подписи, а не набивать ключи.</li>
          <li>Mobile-first — это одинаковый контент, читаемый шрифт и tap targets около 44px.</li>
          <li>INP лечится не магией, а меньшим JavaScript на старте и отложенной загрузкой тяжёлых страниц.</li>
          <li>500+ слов имеют смысл только если это чеклист, примеры, ссылки и ответы на реальные запросы.</li>
          <li>Off-page флаги не чинятся HTML-ом: нужны dofollow mentions, профили, партнёрства и нормальные кейсы.</li>
        </ul>
      </section>

      <section className="home-section home-seo-section" aria-labelledby="home-checklist">
        <h2 id="home-checklist">Мой чеклист перед тем, как доверять агенту</h2>
        <ul className="home-seo-list">
          <li>Дать агенту реальные файлы проекта, а не пересказ архитектуры.</li>
          <li>Разделить задачу: ресёрч отдельно, правки отдельно, ревью отдельно.</li>
          <li>Запустить build, typecheck, smoke-тест и mobile viewport до деплоя.</li>
          <li>Проверить, что агент не трогал чужие изменения и не унёс секреты.</li>
          <li>Сохранить выводы в GBrain/Obsidian, если это повторится в будущем.</li>
        </ul>
        <p>
          На этом сайте я собираю именно такие рабочие паттерны: не “AI сделает
          всё”, а где агент реально ускоряет разработку, аналитику, SEO,
          Telegram-автоматизацию и работу с on-chain данными.
        </p>
      </section>

      <Footer />
    </div>
  )
}
