import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// Initialize Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        initData: string
        initDataUnsafe?: { start_param?: string }
        platform: string
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (cb: () => void) => void
          offClick: (cb: () => void) => void
        }
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink: (url: string) => void
      }
    }
    __IS_TMA__?: boolean
    __openUrl__?: (url: string) => void
  }
}

window.__IS_TMA__ = false

function hasTelegramLaunchParams() {
  return window.location.hash.includes('tgWebApp') || window.location.search.includes('tgWebApp')
}

function initTelegramWebApp() {
  const tg = window.Telegram?.WebApp
  window.__IS_TMA__ = !!tg?.initData
  if (!window.__IS_TMA__ || !tg) return

  tg.ready()
  tg.expand()
  tg.setHeaderColor('#F5F5F0')
  tg.setBackgroundColor('#F5F5F0')

  if (window.location.hash.includes('tgWebApp')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  window.dispatchEvent(new Event('telegram-webapp-ready'))
}

function loadTelegramSdkIfNeeded() {
  if (window.Telegram?.WebApp) {
    initTelegramWebApp()
    return
  }
  if (!hasTelegramLaunchParams()) return

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-web-app.js'
  script.async = true
  script.onload = initTelegramWebApp
  script.onerror = () => { window.__IS_TMA__ = false }
  document.head.appendChild(script)
}

// Universal link opener: uses Telegram native methods in TMA, falls back to window.open
window.__openUrl__ = (url: string) => {
  const tg = window.Telegram?.WebApp
  if (window.__IS_TMA__ && tg) {
    try {
      const isTgLink = url.startsWith('https://t.me/') || url.startsWith('http://t.me/')
      if (isTgLink && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(url)
        return
      }
      if (typeof tg.openLink === 'function') {
        tg.openLink(url)
        return
      }
    } catch {
      // fall through to window.open
    }
  }
  window.open(url, '_blank')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

loadTelegramSdkIfNeeded()
