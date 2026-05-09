import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { trackNav } from '../analytics'
import { useDocumentMeta } from '../useDocumentMeta'

const navItems = [
  { path: '/about', title: 'Знакомство', subtitle: 'Обо мне подробнее' },
  { path: '/posts', title: 'Топ посты', subtitle: 'Блог и мысли' },
  { path: '/ai-course', title: 'AI Agents курс', subtitle: 'На основе моих публикаций', badge: 'FREE' },
  { path: '/closed', title: 'Закрытый канал', subtitle: 'Сообщество' },
  { path: '/work-together', title: 'Го поработаем', subtitle: 'Консалтинг' },
]

export function Home() {
  const navigate = useNavigate()
  useDocumentMeta({
    title: 'Даниил Охлопков — AI, данные, крипта',
    description: 'Head of Analytics @ TON Foundation. Бесплатный курс по AI-агентам, лучшие посты, консалтинг.',
    canonical: 'https://ohld.github.io/',
  })

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header-name">Даниил<br />Охлопков</h1>
        <div className="page-header-handle">
          <span className="page-header-dot" />
          <span className="page-header-mono">@danokhlopkov</span>
        </div>
        <p className="page-header-bio">
          Head of Analytics @ TON Foundation.<br />Пишу про AI-агентов, данные и крипту.
        </p>
      </header>

      {/* Navigation */}
      <nav className="nav-border">
        {navItems.map((item) => (
          <button
            key={item.path}
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

      <div
        className="content-card"
        onClick={() => openUrl('https://www.youtube.com/watch?v=Fxw6IQuL36o', 'home', 'youtube_video')}
        role="link"
      >
        <div className="content-card-meta">
          <span>YOUTUBE</span>
          <span className="content-card-dot" />
          <span>3 МАР 2026</span>
        </div>
        <p className="content-card-title">
          Подкаст #2 с Сашей Нотченко (@technotears) — 16 лет в ML. Про self-hosted AI, приватность и как голосом управлять Doom.
        </p>
      </div>

      <Footer />
    </div>
  )
}
