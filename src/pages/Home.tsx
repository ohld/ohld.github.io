import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { ArrowRightIcon, ArrowRightUpIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { trackNav } from '../analytics'
import { useDocumentMeta } from '../useDocumentMeta'

const navItems = [
  { path: '/about', title: 'Знакомство', subtitle: 'Обо мне подробнее' },
  { path: '/posts', title: 'Топ посты', subtitle: 'Блог и мысли' },
  { path: '/ai-course', title: 'AI Agents курс', subtitle: 'На основе моих публикаций', badge: 'FREE' },
  { path: '/private-channel', title: 'Закрытый канал', subtitle: 'Сообщество' },
  { path: '/work-together', title: 'Го поработаем', subtitle: 'Консалтинг' },
]

const focusAreas = [
  { title: 'AI-агенты', text: 'Пишу и собираю реальные флоу с Claude Code, MCP, Obsidian и локальными автоматизациями. Не про магию в промптах, а про то, как агентам давать контекст, задачи, ревью и рабочий контур.' },
  { title: 'TON и данные', text: 'В TON Foundation занимаюсь аналитикой, on-chain research и инструментами для аналитиков. Мне интересны понятные метрики, нормальные датасеты и инфраструктура, на которой можно принимать продуктовые решения.' },
  { title: 'Telegram ecosystem', text: 'Давно живу внутри Telegram: боты, Mini Apps, каналы, Ads, TG+TON связки. До TON строил ботовые продукты с миллионами пользователей и до сих пор смотрю на Telegram как на самый живой интерфейс для AI.' },
]

function handleExternalClick(event: MouseEvent<HTMLAnchorElement>, url: string, label: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  openUrl(url, 'home', label)
}

export function Home() {
  const navigate = useNavigate()
  useDocumentMeta({
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: 'Head of Analytics @ TON Foundation. AI-агенты, on-chain аналитика, Telegram/TON, лучшие посты и консалтинг.',
    canonical: 'https://ai.okhlopkov.com/',
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
          Head of Analytics @ TON Foundation.<br />Пишу про AI-агентов, данные и крипту.
        </p>
      </header>

      <main>
        <section className="home-section home-intro" aria-labelledby="home-intro-title">
          <h2 id="home-intro-title">Коротко</h2>
          <p>
            Я Даниил Охлопков. Сейчас веду аналитику в TON Foundation: on-chain данные, Dune, research, метрики экосистемы и инструменты, которые помогают людям быстрее понимать блокчейн. До этого был CTO Via Protocol, строил data platform для VC, делал Telegram-ботов и попал в Forbes 30 Under 30 Russia.
          </p>
          <p>
            Этот сайт — входная точка во всё, что я публикую: бесплатный курс по AI-агентам, лучшие посты из Telegram, рабочие форматы для консалтинга и ссылки на соцсети. Если нужно понять, чем я занимаюсь и где со мной пересечься, здесь меньше шума, чем в ленте.
          </p>
        </section>

        <section className="home-section" aria-labelledby="home-focus-title">
          <h2 id="home-focus-title">Фокус</h2>
          <div className="home-focus-grid">
            {focusAreas.map((area) => (
              <article className="home-focus-card" key={area.title}>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-nav-title">
          <h2 id="home-nav-title">Что открыть</h2>
          <p>
            Если ты пришёл за практикой — начинай с AI Agents курса. Если нужен бэкграунд — открой «Обо мне». Если хочешь быстро понять мой стиль мышления, лучше всего работают топовые посты: там AI, стартапы, TON, Telegram и немного личного опыта без корпоративного слопа.
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

      <section className="home-section" aria-labelledby="home-start-title">
        <h2 id="home-start-title">С чего начать</h2>
        <p>
          Для AI-агентов я собрал маршрут из своих постов, стримов и лонгридов: от «что вообще поменялось» до конкретных рабочих флоу с Claude Code, plan mode, worktrees, MCP и личным вторым мозгом в Obsidian. Это не академический курс, а набор материалов, после которого можно пойти и навайбкодить что-то живое.
        </p>
        <p>
          Для TON и данных я чаще показываю подход: как смотреть на экосистему через метрики, где искать источники, как не путать красивый график с выводом и почему нормальная аналитика начинается с вопроса, а не с SQL. Для Telegram — пишу про распределение, Mini Apps, ботов, каналы и то, как AI постепенно становится нормальным пользовательским интерфейсом.
        </p>
        <p>
          Если нужен не контент, а работа руками, есть отдельная страница «Го поработаем»: консалтинг по AI-агентам, web3/TON, Telegram и рекламе в канале. Обычно я полезен там, где нужно быстро собрать картину, превратить хаос в план и довести до первого живого прототипа.
        </p>
        <p>
          Основная лента у меня в Telegram: там быстрые мысли, тесты инструментов, ссылки и рабочие заметки. YouTube — для разговоров и стримов с людьми, которые реально используют AI в работе. X — международный контекст про crypto, AI и data. Instagram живёт отдельно: больше личного и travel, меньше профессиональной инфы. Я не пытаюсь тащить одно и то же во все сети; каждая площадка нужна под свой формат, а сайт остаётся картой evergreen материалов, которые не должны утонуть в ленте.
        </p>
      </section>

      <section className="home-section home-video" aria-labelledby="home-video-title">
        <h2 id="home-video-title">Видео</h2>
        <a
          className="content-card"
          href="https://www.youtube.com/watch?v=Fxw6IQuL36o"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => handleExternalClick(event, 'https://www.youtube.com/watch?v=Fxw6IQuL36o', 'youtube_video')}
        >
          <div className="content-card-meta">
            <span>YOUTUBE</span>
            <span className="content-card-dot" />
            <span>3 МАР 2026</span>
          </div>
          <p className="content-card-title">
            Подкаст #2 с Сашей Нотченко (@technotears) — 16 лет в ML. Про self-hosted AI, приватность и как голосом управлять Doom.
          </p>
          <span className="content-card-link">Смотреть <ArrowRightUpIcon size={15} /></span>
        </a>
      </section>

      <Footer />
    </div>
  )
}
