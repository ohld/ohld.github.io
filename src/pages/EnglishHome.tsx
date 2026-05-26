import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { trackNav } from '../analytics'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { englishArticleItems, englishBlogItems } from '../blog'

const navItems = [
  { path: '/en/blog', title: 'Blog', subtitle: 'Notes and working ideas', items: englishBlogItems.slice(0, 3) },
  { path: '/en/articles', title: 'Articles', subtitle: 'Tutorials, comparisons and explainers', items: englishArticleItems.slice(0, 2) },
  { path: '/en/about', title: 'About', subtitle: 'Background, work and links' },
]

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

      <main className="home-sections" aria-label="Main sections">
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
              <div className="nav-row-right" />
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
