import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from './Icons'

interface BackButtonProps {
  to?: string
  label?: string
}

export function BackButton({ to = '/', label }: BackButtonProps = {}) {
  const navigate = useNavigate()
  const visibleLabel = label || (to.startsWith('/en') ? 'Back' : 'Назад')

  const goBack = useCallback(() => {
    const historyState = window.history.state as { idx?: number } | null
    let hasSameOriginReferrer = false
    try {
      hasSameOriginReferrer = document.referrer
        ? new URL(document.referrer).origin === window.location.origin
        : false
    } catch {
      hasSameOriginReferrer = false
    }

    if ((typeof historyState?.idx === 'number' && historyState.idx > 0) || hasSameOriginReferrer) {
      navigate(-1)
      return
    }

    navigate(to)
  }, [navigate, to])

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!window.__IS_TMA__ || !tg?.BackButton) return

    tg.BackButton.show()
    const handler = () => goBack()
    tg.BackButton.onClick(handler)

    return () => {
      tg.BackButton.offClick(handler)
      tg.BackButton.hide()
    }
  }, [goBack])

  // In TMA — native back button handles it, hide the HTML one
  if (window.__IS_TMA__) return null

  return (
    <button className="back-nav" onClick={goBack}>
      <ChevronLeftIcon size={18} />
      <span>{visibleLabel}</span>
    </button>
  )
}
