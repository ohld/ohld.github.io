import { useLocation } from 'react-router-dom'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function NotFound() {
  const { pathname } = useLocation()
  useDocumentMeta({
    title: '404 — Страница не найдена / Page not found',
    description: 'Страница недоступна. This page is unavailable.',
    canonical: absoluteUrl(pathname),
    alternates: {},
    robots: 'noindex, follow',
  })

  return (
    <main className="page">
      <div className="subpage-header">
        <h1 className="subpage-title">404 — Страница не найдена</h1>
        <p className="subpage-subtitle">Страница недоступна. This page is unavailable.</p>
        <nav aria-label="Навигация / Navigation">
          <a href="/ru/blog/">Блог</a>{' · '}<a href="/en/blog/">Blog in English</a>
        </nav>
      </div>
    </main>
  )
}
