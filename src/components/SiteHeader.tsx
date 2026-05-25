import { Link, useLocation } from 'react-router-dom'
import { trackNav } from '../analytics'
import { isEnglishPath, localizedPath, navLinks } from '../site'

export function SiteHeader() {
  const location = useLocation()
  const isEnglish = isEnglishPath(location.pathname)
  const homePath = isEnglish ? '/en/' : '/'

  return (
    <header className="site-header">
      <Link className="site-header-brand" to={homePath} onClick={() => trackNav(homePath)}>
        <span className="site-header-mark" />
        <span>okhlopkov.com</span>
      </Link>
      <nav className="site-header-nav" aria-label={isEnglish ? 'Primary navigation' : 'Основная навигация'}>
        {navLinks.map((item) => (
          <Link
            key={item.path}
            className="site-header-link"
            to={isEnglish ? item.enPath || item.path : item.path}
            onClick={() => trackNav(isEnglish ? item.enPath || item.path : item.path)}
          >
            {isEnglish ? item.en : item.ru}
          </Link>
        ))}
      </nav>
      <nav className="language-switcher" aria-label={isEnglish ? 'Language' : 'Выбор языка'}>
        <Link
          className={!isEnglish ? 'language-switcher-active' : undefined}
          to={localizedPath(location.pathname, 'ru')}
          aria-current={!isEnglish ? 'page' : undefined}
        >
          RU
        </Link>
        <Link
          className={isEnglish ? 'language-switcher-active' : undefined}
          to={localizedPath(location.pathname, 'en')}
          aria-current={isEnglish ? 'page' : undefined}
        >
          EN
        </Link>
      </nav>
    </header>
  )
}
