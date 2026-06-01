import type { MouseEvent } from 'react'
import type { ReactElement } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TelegramIcon, TwitterXIcon, YoutubeIcon, GithubIcon, LinkedinIcon, InstagramIcon } from './Icons'
import { openUrl } from '../openUrl'
import { sectionNavLinks, shellLangForPath, socialLinks } from '../site'

const iconByLabel: Record<string, ReactElement> = {
  Telegram: <TelegramIcon />,
  YouTube: <YoutubeIcon />,
  Instagram: <InstagramIcon />,
  X: <TwitterXIcon />,
  LinkedIn: <LinkedinIcon />,
  GitHub: <GithubIcon />,
}

function handleSocialClick(event: MouseEvent<HTMLAnchorElement>, url: string, label: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  openUrl(url, 'social', label)
}

export function Footer() {
  const location = useLocation()
  const isEnglish = shellLangForPath(location.pathname) === 'en'

  return (
    <footer className="footer">
      <nav className="footer-links" aria-label={isEnglish ? 'Site sections' : 'Разделы сайта'}>
        <Link to="/">RU</Link>
        <Link to="/en/">EN</Link>
        {sectionNavLinks.map((link) => (
          <Link key={link.path} to={isEnglish ? link.enPath || link.path : link.path}>
            {isEnglish ? link.en : link.ru}
          </Link>
        ))}
        <Link to="/privacy">Privacy</Link>
      </nav>
      <div className="footer-socials">
        {socialLinks.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            onClick={(event) => handleSocialClick(event, s.url, s.label)}
          >
            {iconByLabel[s.label]}
          </a>
        ))}
      </div>
      <span className="footer-copy">© 2026 {isEnglish ? 'Daniil Okhlopkov' : 'Даниил Охлопков'}</span>
    </footer>
  )
}
