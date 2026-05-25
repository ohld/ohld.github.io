import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { trackNav } from '../analytics'
import { absoluteUrl, SITE_DESCRIPTION } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { russianArticleItems, russianBlogItems } from '../blog'

const navItems = [
  { path: '/blog', title: 'Блог', subtitle: 'Telegram-посты как индексируемые материалы' },
  { path: '/articles', title: 'Статьи', subtitle: 'SEO-гайды, сравнения и туториалы', badge: 'NEW' },
  { path: '/about', title: 'Обо мне', subtitle: 'Бэкграунд, опыт и ссылки' },
]

const latestBlogItems = russianBlogItems.slice(0, 3)
const latestArticles = russianArticleItems.slice(0, 2)

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
          AI-агенты на практике: Codex, Claude Code, MCP, OpenClaw и рабочие флоу.
        </p>
      </header>

      <main>
        <section className="home-section home-intro" aria-labelledby="home-intro-title">
          <h2 id="home-intro-title">Коротко</h2>
          <p>
            Это сайт Дана Охлопкова про практические AI-агенты, Claude Code, Codex, MCP, TON-данные и Telegram-автоматизацию. Главная страница — роутер: блог с моими Telegram-постами, SEO-статьи и короткий about.
          </p>
        </section>
      </main>

      <nav className="nav-border" aria-label="Основные разделы">
        {navItems.map((item) => (
          <button
            key={item.path}
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
              <ArrowRightIcon size={20} style={{ opacity: 0.3 }} />
            </div>
          </button>
        ))}
      </nav>

      <section className="home-section" aria-labelledby="home-blog-title">
        <h2 id="home-blog-title">Последнее из блога</h2>
        <div className="home-card-list">
          {latestBlogItems.map((item) => (
            <Link className="home-list-link" to={item.path} key={item.path}>
              <span>{item.title}</span>
              <ArrowRightIcon size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-articles-title">
        <h2 id="home-articles-title">SEO-статьи</h2>
        <div className="home-card-list">
          {latestArticles.map((article) => (
            <Link className="home-list-link" to={article.path} key={article.path}>
              <span>{article.title}</span>
              <ArrowRightIcon size={16} />
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
