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

      <Footer />
    </div>
  )
}
