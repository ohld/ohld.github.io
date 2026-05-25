import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { trackNav } from '../analytics'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { englishArticleItems, englishBlogItems } from '../blog'

const navItems = [
  { path: '/en/blog', title: 'Blog', subtitle: 'English preserved posts and notes' },
  { path: '/en/articles', title: 'Articles', subtitle: 'Tutorials, comparisons and explainers' },
  { path: '/en/about', title: 'About', subtitle: 'Background, work and links' },
]

const latestBlogItems = englishBlogItems.slice(0, 3)
const latestArticleItems = englishArticleItems.slice(0, 3)

export function EnglishHome() {
  const navigate = useNavigate()
  useDocumentMeta({
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    canonical: absoluteUrl('/en/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Daniil<br />Okhlopkov</h1>
        <div className="page-header-handle">
          <span className="page-header-dot" />
          <span className="page-header-mono">@danokhlopkov</span>
        </div>
        <p className="page-header-bio">
          Head of Analytics @ TON Foundation.<br />I write about AI agents, data, crypto and Telegram.
        </p>
      </header>

      <main>
        <section className="home-section home-intro" aria-labelledby="home-en-intro-title">
          <h2 id="home-en-intro-title">Short version</h2>
          <p>
            This is Daniil Okhlopkov's site about practical AI agents, Claude Code, Codex, MCP, TON data and Telegram automation. New content is Russian-first; English pages stay crawlable when there is a real translated or preserved version.
          </p>
        </section>
      </main>

      <nav className="nav-border" aria-label="Main sections">
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
              <ArrowRightIcon size={20} style={{ opacity: 0.3 }} />
            </div>
          </button>
        ))}
      </nav>

      <section className="home-section" aria-labelledby="home-en-blog-title">
        <h2 id="home-en-blog-title">Latest blog</h2>
        <div className="home-card-list">
          {latestBlogItems.map((item) => (
            <Link className="home-list-link" to={item.path} key={item.path}>
              <span>{item.title}</span>
              <ArrowRightIcon size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-en-articles-title">
        <h2 id="home-en-articles-title">Articles</h2>
        <div className="home-card-list">
          {latestArticleItems.map((item) => (
            <Link className="home-list-link" to={item.path} key={item.path}>
              <span>{item.title}</span>
              <ArrowRightIcon size={16} />
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
