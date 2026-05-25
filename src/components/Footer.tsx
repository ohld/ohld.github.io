import type { MouseEvent } from 'react'
import { TelegramIcon, TwitterXIcon, YoutubeIcon, GithubIcon, LinkedinIcon, InstagramIcon } from './Icons'
import { openUrl } from '../openUrl'

const socials = [
  { label: 'Telegram', url: 'https://t.me/danokhlopkov', icon: <TelegramIcon /> },
  { label: 'YouTube', url: 'https://youtube.com/@danokhlopkov', icon: <YoutubeIcon /> },
  { label: 'Instagram', url: 'https://instagram.com/d7733o', icon: <InstagramIcon /> },
  { label: 'X', url: 'https://x.com/danokhlopkov', icon: <TwitterXIcon /> },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/danokhlopkov/', icon: <LinkedinIcon /> },
  { label: 'GitHub', url: 'https://github.com/ohld', icon: <GithubIcon /> },
]

function handleSocialClick(event: MouseEvent<HTMLAnchorElement>, url: string, label: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  openUrl(url, 'social', label)
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-socials">
        {socials.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            onClick={(event) => handleSocialClick(event, s.url, s.label)}
          >
            {s.icon}
          </a>
        ))}
      </div>
      <span className="footer-copy">© 2026 Даниил Охлопков</span>
    </footer>
  )
}
