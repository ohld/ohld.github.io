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
        <h1 className="page-header-name">Даниил Охлопков</h1>
        <p className="page-header-bio">
          Я разработчик и аналитик из TON Foundation, работаю на стыке данных,
          продуктов и Telegram-экосистемы. Сейчас фокусируюсь на
          <a href={topicPath('ai-agents')}> AI-агентах</a>: Codex, Claude Code,
          MCP, автоматизации рабочих процессов и инструментах, которые реально
          помогают командам писать, исследовать и запускать быстрее. Здесь
          собираю практические заметки про AI, TON-данные и инженерные подходы
          без маркетинговой магии.
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
                <span className="nav-row-title">
                  {item.title}
                  {item.badge && <span className="nav-row-badge">{item.badge}</span>}
                </span>
                <span className="nav-row-subtitle">{item.subtitle}</span>
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

      <section className="home-section home-detail-section" aria-labelledby="home-start">
        <h2 id="home-start">Если вы настраиваете AI-агентов</h2>
        <p>
          Начните с <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">моего Claude Code setup</a>:
          там собраны MCP-серверы, hooks, skills, subagents и правила, которые
          пережили несколько месяцев ежедневной работы. Если агент начинает
          забывать контекст, откройте разбор <a href="/claude-code-compaction-kak-rabotaet/">Claude Code compaction</a>.
          Если нужно понять, когда брать Codex, а когда Claude Code, смотрите
          <a href="/ru/blog/claude-code-vs-codex-perehod/">переход на Codex</a>.
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

      <section className="home-section home-detail-section" aria-labelledby="home-practical">
        <h2 id="home-practical">Практические входы</h2>
        <ul className="home-detail-list">
          <li><a href="/web-scraping-ai-agents-2026/">Web scraping AI agents</a> — когда браузерный агент лучше старого парсера.</li>
          <li><a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">Second brain + Obsidian</a> — как хранить сырьё, решения и память проекта.</li>
          <li><a href="/luchshie-skills-mcp-claude-code-agent-browser/">Skills и MCP для Claude Code</a> — что ставить, а что не усложнять.</li>
          <li><a href="/ru/articles/ai-tools-for-designers-design-engineering-agents/">AI-инструменты для дизайнеров</a> — design engineering без generic UI-slop.</li>
          <li><a href="/en/articles/hermes-agent-vs-openclaw/">Hermes Agent vs OpenClaw</a> — какой self-hosted AI agent выбрать после демо.</li>
          <li><a href="/ru/blog/gstack-goal-office-hours-ai-workflow/">GStack, goal и office hours</a> — как вести длинную agent-задачу до результата.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-map">
        <h2 id="home-map">Карта терминов без маркетинга</h2>
        <ul className="home-detail-list">
          <li><strong>Project rules</strong> — инварианты репозитория: стиль, запреты, команды проверки, где лежат данные.</li>
          <li><strong>Skills</strong> — короткие воспроизводимые процедуры: audit, ship, review, scrape, deploy.</li>
          <li><strong>MCP</strong> — доступ к живым системам: браузер, GBrain, GitHub, аналитика, документы, внешние API.</li>
          <li><strong>Hooks</strong> — автоматические стопперы перед опасными командами, секретами и случайным деплоем.</li>
          <li><strong>Subagents</strong> — отдельный контекст для ресёрча, QA и независимого ревью, чтобы не засорять основную задачу.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-tool-choice">
        <h2 id="home-tool-choice">Когда брать какой инструмент</h2>
        <p>
          Codex удобен, когда нужно спокойно пройти по репозиторию, внести
          правки, проверить diff и довести задачу до деплоя. Claude Code чаще
          беру для быстрых исследовательских сессий, работы с длинным
          контекстом и экспериментов с MCP. GStack полезен как рабочая обвязка:
          browser smoke, goal, QA, review, deploy и память между длинными
          задачами.
        </p>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-use-cases">
        <h2 id="home-use-cases">Где агенты реально помогают</h2>
        <ul className="home-detail-list">
          <li>Ревью больших diff: найти риск, проверить границы изменений и попросить второй взгляд.</li>
          <li>Миграции: пройти старые URL, sitemap, redirects, canonical и smoke-тесты без ручного чеклиста.</li>
          <li>Исследование инструментов: собрать источники, сравнить ограничения и оставить воспроизводимый вывод.</li>
          <li>Работа с данными: быстро собрать запрос, проверить странные строки и превратить вывод в решение.</li>
          <li>Личные системы: Obsidian, GBrain и проектные notes, где агент помнит решения лучше человека.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-stack">
        <h2 id="home-stack">Минимальный стек</h2>
        <ul className="home-detail-list">
          <li>Один понятный instruction file в репозитории: правила, команды проверки и границы задачи.</li>
          <li>Браузерный smoke-тест для важных экранов, особенно после правок навигации и статических страниц.</li>
          <li>Память в GBrain или Obsidian: решения, грабли, ссылки на исходники и следующий шаг.</li>
          <li>Отдельное ревью перед merge: свежий контекст часто ловит то, что пропустил основной агент.</li>
        </ul>
      </section>

      <section className="home-section home-detail-section" aria-labelledby="home-checklist">
        <h2 id="home-checklist">Мой чеклист перед тем, как доверять агенту</h2>
        <ul className="home-detail-list">
          <li>Дать агенту реальные файлы проекта, а не пересказ архитектуры.</li>
          <li>Разделить задачу: ресёрч отдельно, правки отдельно, ревью отдельно.</li>
          <li>Запустить build, typecheck, smoke-тест и mobile viewport до деплоя.</li>
          <li>Проверить, что агент не трогал чужие изменения и не унёс секреты.</li>
          <li>Сохранить выводы в GBrain/Obsidian, если это повторится в будущем.</li>
        </ul>
        <p>
          Здесь собраны рабочие паттерны для разработки, аналитики,
          Telegram-автоматизации, design engineering и on-chain данных. Главный
          критерий один: можно ли повторить подход на реальном проекте без
          магии и лишней веры в модель.
        </p>
      </section>

      <Footer />
    </div>
  )
}
