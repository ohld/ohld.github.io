import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { trackPageView, useScrollDepth } from './analytics'

const postsImport = () => import('./pages/Posts').then(m => ({ default: m.Posts }))
const courseImport = () => import('./pages/AICourse').then(m => ({ default: m.AICourse }))
const closedImport = () => import('./pages/ClosedChannel').then(m => ({ default: m.ClosedChannel }))
const adsImport = () => import('./pages/Ads').then(m => ({ default: m.WorkTogether }))
const aboutImport = () => import('./pages/About').then(m => ({ default: m.About }))
const mvhImport = () => import('./pages/MarkdownVsHtml').then(m => ({ default: m.MarkdownVsHtml }))

const Posts = lazy(postsImport)
const AICourse = lazy(courseImport)
const ClosedChannel = lazy(closedImport)
const WorkTogether = lazy(adsImport)
const About = lazy(aboutImport)
const MarkdownVsHtml = lazy(mvhImport)

// Preload all chunks after home page renders so subpages open instantly
function usePreloadChunks() {
  useEffect(() => {
    const preload = () => {
      postsImport()
      courseImport()
      closedImport()
      adsImport()
      aboutImport()
      mvhImport()
    }
    // requestIdleCallback not available in Telegram WebView (iOS)
    const id = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(preload)
      : setTimeout(preload, 100)
    return () => {
      typeof cancelIdleCallback !== 'undefined'
        ? cancelIdleCallback(id as number)
        : clearTimeout(id as number)
    }
  }, [])
}

function usePageTracking() {
  const location = useLocation()
  const getScrollDepth = useMemo(() => useScrollDepth(), [location.pathname])

  useEffect(() => {
    trackPageView(location.pathname)

    const initData = window.Telegram?.WebApp?.initData
    if (window.__IS_TMA__ && initData) {
      fetch('https://ohldbot.swanrate.com/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, page: location.pathname }),
      }).catch(() => {})
    }

    const onScroll = () => getScrollDepth()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname, getScrollDepth])
}

function App() {
  usePreloadChunks()
  usePageTracking()

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/ai-course" element={<AICourse />} />
        <Route path="/closed" element={<ClosedChannel />} />
        <Route path="/work-together" element={<WorkTogether />} />
        <Route path="/about" element={<About />} />
        <Route path="/markdown-vs-html" element={<MarkdownVsHtml />} />
      </Routes>
    </Suspense>
  )
}

export default App
