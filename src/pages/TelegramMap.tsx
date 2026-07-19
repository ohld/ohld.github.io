import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import './TelegramMap.css'

type Neighbor = { id: number; similarity: number }
type AtlasPost = {
  id: number
  date: string
  year: number
  url: string
  text: string
  topic: string
  x: number
  y: number
  views: number
  reactions: number
  comments: number
  forwards: number
  hasMedia: boolean
  neighbors: Neighbor[]
}
type AtlasTopic = { id: string; label: string; color: string; count: number }
type AtlasData = {
  version: number
  meta: {
    posts: number
    newestId: number
    newestDate: string
    generatedAt: string
  }
  topics: AtlasTopic[]
  posts: AtlasPost[]
}
type View = { scale: number; x: number; y: number }
type CanvasSize = { width: number; height: number; dpr: number }

const DATA_URL = '/data/telegram-atlas.json'
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
const numberFormatter = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

function formatDate(date: string) {
  const value = new Date(`${date.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(value.getTime()) ? date : dateFormatter.format(value)
}

function pointRadius(post: AtlasPost) {
  return 2.2 + Math.min(3.8, Math.log10(Math.max(1, post.views)) * 0.55)
}

function AtlasCanvas({
  allPosts,
  visiblePosts,
  topics,
  selectedId,
  resetToken,
  onSelect,
  onHover,
}: {
  allPosts: AtlasPost[]
  visiblePosts: AtlasPost[]
  topics: AtlasTopic[]
  selectedId: number | null
  resetToken: number
  onSelect: (id: number) => void
  onHover: (id: number | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View>({ scale: 1, x: 0, y: 0 })
  const pointerRef = useRef<{ originX: number; originY: number; x: number; y: number; moved: boolean } | null>(null)
  const redrawFrameRef = useRef<number | null>(null)
  const [size, setSize] = useState<CanvasSize>({ width: 1, height: 1, dpr: 1 })
  const [viewVersion, setViewVersion] = useState(0)

  const queueRedraw = useCallback(() => {
    if (redrawFrameRef.current !== null) return
    redrawFrameRef.current = window.requestAnimationFrame(() => {
      redrawFrameRef.current = null
      setViewVersion(value => value + 1)
    })
  }, [])

  useEffect(() => () => {
    if (redrawFrameRef.current !== null) window.cancelAnimationFrame(redrawFrameRef.current)
  }, [])

  const topicColors = useMemo(() => new Map(topics.map(topic => [topic.id, topic.color])), [topics])
  const postsById = useMemo(() => new Map(allPosts.map(post => [post.id, post])), [allPosts])
  const visibleIds = useMemo(() => new Set(visiblePosts.map(post => post.id)), [visiblePosts])

  const screenPoint = useCallback((post: AtlasPost, view = viewRef.current) => {
    const padding = 26
    const worldX = padding + post.x * Math.max(1, size.width - padding * 2)
    const worldY = padding + post.y * Math.max(1, size.height - padding * 2)
    return { x: worldX * view.scale + view.x, y: worldY * view.scale + view.y }
  }, [size.height, size.width])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 1 || size.height <= 1) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = '#F7F6F2'
    context.fillRect(0, 0, size.width, size.height)

    const isFiltered = visiblePosts.length !== allPosts.length
    if (isFiltered) {
      context.fillStyle = 'rgba(26, 26, 26, 0.09)'
      for (const post of allPosts) {
        if (visibleIds.has(post.id)) continue
        const point = screenPoint(post)
        if (point.x < -5 || point.y < -5 || point.x > size.width + 5 || point.y > size.height + 5) continue
        context.beginPath()
        context.arc(point.x, point.y, 1.4, 0, Math.PI * 2)
        context.fill()
      }
    }

    const selected = selectedId ? postsById.get(selectedId) : undefined
    if (selected) {
      const origin = screenPoint(selected)
      context.lineWidth = 1
      for (const neighbor of selected.neighbors) {
        const target = postsById.get(neighbor.id)
        if (!target) continue
        const point = screenPoint(target)
        context.strokeStyle = `rgba(23, 95, 152, ${Math.max(0.12, neighbor.similarity * 0.42)})`
        context.beginPath()
        context.moveTo(origin.x, origin.y)
        context.lineTo(point.x, point.y)
        context.stroke()
      }
    }

    for (const post of visiblePosts) {
      const point = screenPoint(post)
      if (point.x < -10 || point.y < -10 || point.x > size.width + 10 || point.y > size.height + 10) continue
      const selectedPoint = post.id === selectedId
      context.globalAlpha = selectedPoint ? 1 : 0.78
      context.fillStyle = topicColors.get(post.topic) || '#5F6F85'
      context.beginPath()
      context.arc(point.x, point.y, selectedPoint ? 7 : pointRadius(post), 0, Math.PI * 2)
      context.fill()
      if (selectedPoint) {
        context.strokeStyle = '#FFFFFF'
        context.lineWidth = 3
        context.stroke()
        context.strokeStyle = '#1A1A1A'
        context.lineWidth = 1
        context.stroke()
      }
    }
    context.globalAlpha = 1

    if (viewRef.current.scale <= 1.7 && visiblePosts.length > 80) {
      const centroids = new Map<string, { x: number; y: number; count: number }>()
      for (const post of visiblePosts) {
        const point = screenPoint(post)
        const current = centroids.get(post.topic) || { x: 0, y: 0, count: 0 }
        current.x += point.x
        current.y += point.y
        current.count += 1
        centroids.set(post.topic, current)
      }
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = '600 12px Inter, sans-serif'
      for (const topic of topics) {
        const centroid = centroids.get(topic.id)
        if (!centroid || centroid.count < 8) continue
        const x = centroid.x / centroid.count
        const y = centroid.y / centroid.count
        context.lineWidth = 5
        context.strokeStyle = 'rgba(247, 246, 242, 0.9)'
        context.strokeText(topic.label, x, y)
        context.fillStyle = '#1A1A1A'
        context.fillText(topic.label, x, y)
      }
    }

    if (!visiblePosts.length) {
      context.fillStyle = 'rgba(26, 26, 26, 0.55)'
      context.textAlign = 'center'
      context.font = '14px Inter, sans-serif'
      context.fillText('Ничего не найдено', size.width / 2, size.height / 2)
    }
  }, [allPosts, postsById, screenPoint, selectedId, size, topicColors, topics, visibleIds, visiblePosts])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const update = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      setSize({ width: rect.width, height: rect.height, dpr })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  useEffect(redraw, [redraw, viewVersion])

  useEffect(() => {
    viewRef.current = { scale: 1, x: 0, y: 0 }
    queueRedraw()
  }, [queueRedraw, resetToken])

  const findPost = (x: number, y: number) => {
    let best: { id: number; distance: number } | null = null
    for (const post of visiblePosts) {
      const point = screenPoint(post)
      const distance = Math.hypot(point.x - x, point.y - y)
      const threshold = Math.max(9, pointRadius(post) + 5)
      if (distance <= threshold && (!best || distance < best.distance)) best = { id: post.id, distance }
    }
    return best?.id ?? null
  }

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event)
    pointerRef.current = { originX: point.x, originY: point.y, ...point, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event)
    const pointer = pointerRef.current
    if (!pointer) {
      onHover(findPost(point.x, point.y))
      return
    }
    const dx = point.x - pointer.x
    const dy = point.y - pointer.y
    if (Math.hypot(point.x - pointer.originX, point.y - pointer.originY) > 5) pointer.moved = true
    if (pointer.moved) {
      viewRef.current.x += dx
      viewRef.current.y += dy
      pointer.x = point.x
      pointer.y = point.y
      queueRedraw()
    }
  }

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event)
    const pointer = pointerRef.current
    if (pointer && !pointer.moved) {
      const id = findPost(point.x, point.y)
      if (id) onSelect(id)
    }
    pointerRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const zoomAt = (factor: number, x = size.width / 2, y = size.height / 2) => {
    const current = viewRef.current
    const nextScale = Math.max(0.75, Math.min(8, current.scale * factor))
    const worldX = (x - current.x) / current.scale
    const worldY = (y - current.y) / current.scale
    viewRef.current = {
      scale: nextScale,
      x: x - worldX * nextScale,
      y: y - worldY * nextScale,
    }
    queueRedraw()
  }

  return (
    <div className="atlas-canvas-wrap" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="atlas-canvas"
        aria-label="Смысловая карта постов @danokhlopkov. Цвет показывает тему, расстояние — близость текстов."
        role="img"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerRef.current = null }}
        onPointerLeave={() => { if (!pointerRef.current) onHover(null) }}
        onWheel={(event) => {
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          zoomAt(event.deltaY < 0 ? 1.16 : 0.86, event.clientX - rect.left, event.clientY - rect.top)
        }}
      />
      <div className="atlas-zoom-controls" aria-label="Масштаб карты">
        <button type="button" onClick={() => zoomAt(1.28)} aria-label="Приблизить">+</button>
        <button type="button" onClick={() => zoomAt(0.78)} aria-label="Отдалить">−</button>
      </div>
      <div className="atlas-map-hint">Кнопки — масштаб · потянуть — переместить</div>
    </div>
  )
}

function PostPanel({
  post,
  topicsById,
  postsById,
  onSelect,
}: {
  post: AtlasPost | null
  topicsById: Map<string, AtlasTopic>
  postsById: Map<number, AtlasPost>
  onSelect: (id: number) => void
}) {
  if (!post) {
    return (
      <aside className="atlas-detail atlas-detail-empty">
        <p className="atlas-eyebrow">Как читать карту</p>
        <h2>Выбери точку</h2>
        <p>Чем ближе посты, тем сильнее похож их смысл. Цвет показывает тему, размер точки — просмотры.</p>
      </aside>
    )
  }

  const topic = topicsById.get(post.topic)
  return (
    <aside className="atlas-detail" aria-live="polite">
      <div className="atlas-detail-meta">
        <span className="atlas-topic-pill" style={{ '--topic-color': topic?.color } as React.CSSProperties}>
          {topic?.label || 'Без темы'}
        </span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </div>
      <p className="atlas-post-text">{post.text}</p>
      <div className="atlas-metrics" aria-label="Статистика поста">
        {post.views > 0 && <span>{numberFormatter.format(post.views)} просмотров</span>}
        {post.reactions > 0 && <span>{numberFormatter.format(post.reactions)} реакций</span>}
        {post.comments > 0 && <span>{numberFormatter.format(post.comments)} комментариев</span>}
      </div>
      <a
        className="atlas-telegram-link"
        href={post.url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          if (!window.__IS_TMA__ || !window.__openUrl__) return
          event.preventDefault()
          window.__openUrl__(post.url)
        }}
      >
        Открыть в Telegram ↗
      </a>
      <div className="atlas-neighbors">
        <h3>Похожие посты</h3>
        {post.neighbors.slice(0, 5).map(neighbor => {
          const item = postsById.get(neighbor.id)
          if (!item) return null
          return (
            <button type="button" key={neighbor.id} onClick={() => onSelect(neighbor.id)}>
              <span>{item.text.slice(0, 96)}{item.text.length > 96 ? '…' : ''}</span>
              <small>{Math.round(neighbor.similarity * 100)}%</small>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export function TelegramMap() {
  const [data, setData] = useState<AtlasData | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    return value && /^\d+$/.test(value) ? Number(value) : null
  })
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [resetToken, setResetToken] = useState(0)

  useDocumentMeta({
    title: 'Смысловая карта Telegram — Даниил Охлопков',
    description: 'Интерактивная карта 1 500+ постов @danokhlopkov: темы, поиск и похожие публикации за шесть лет.',
    canonical: absoluteUrl('/telegram-map/'),
    lang: 'ru',
    alternates: { ru: absoluteUrl('/telegram-map/'), 'x-default': absoluteUrl('/telegram-map/') },
  })

  useEffect(() => {
    const controller = new AbortController()
    fetch(DATA_URL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<AtlasData>
      })
      .then(setData)
      .catch(reason => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError('Карта не загрузилась. Попробуй обновить страницу.')
      })
    return () => controller.abort()
  }, [])

  const topicsById = useMemo(() => new Map((data?.topics || []).map(item => [item.id, item])), [data])
  const postsById = useMemo(() => new Map((data?.posts || []).map(item => [item.id, item])), [data])
  const years = useMemo(() => [...new Set((data?.posts || []).map(post => post.year))].sort((a, b) => b - a), [data])

  const visiblePosts = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLocaleLowerCase('ru-RU')
    return data.posts.filter(post => {
      if (topic !== 'all' && post.topic !== topic) return false
      if (year !== 'all' && post.year !== Number(year)) return false
      if (!needle) return true
      const topicLabel = topicsById.get(post.topic)?.label || ''
      return post.text.toLocaleLowerCase('ru-RU').includes(needle)
        || topicLabel.toLocaleLowerCase('ru-RU').includes(needle)
        || String(post.id) === needle
    })
  }, [data, query, topic, topicsById, year])

  useEffect(() => {
    if (!data || !selectedId || visiblePosts.some(post => post.id === selectedId)) return
    setSelectedId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('post')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [data, selectedId, visiblePosts])

  const selectPost = useCallback((id: number) => {
    setSelectedId(id)
    setHoveredId(null)
    const url = new URL(window.location.href)
    url.searchParams.set('post', String(id))
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const activePost = postsById.get(selectedId || hoveredId || -1) || null
  const resultSuggestions = query.trim() ? visiblePosts.slice(0, 6) : []

  return (
    <div className="page atlas-page">
      <header className="atlas-header">
        <BackButton />
        <p className="atlas-eyebrow">@danokhlopkov · 2020–2026</p>
        <h1>Смысловая карта Telegram</h1>
        <p>Все тексты канала разложены по смыслу. Ищи тему, выбирай точку и переходи к похожим постам.</p>
      </header>

      <main className="atlas-shell">
        <section className="atlas-toolbar" aria-label="Фильтры карты">
          <label className="atlas-search">
            <span className="sr-only">Поиск по постам</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти пост или тему" />
          </label>
          <label>
            <span className="sr-only">Тема</span>
            <select value={topic} onChange={event => setTopic(event.target.value)}>
              <option value="all">Все темы</option>
              {data?.topics.map(item => <option key={item.id} value={item.id}>{item.label} · {item.count}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Год</span>
            <select value={year} onChange={event => setYear(event.target.value)}>
              <option value="all">Все годы</option>
              {years.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="atlas-reset" onClick={() => setResetToken(value => value + 1)}>Сбросить вид</button>
          <span className="atlas-count">{visiblePosts.length.toLocaleString('ru-RU')} из {data ? data.meta.posts.toLocaleString('ru-RU') : '…'}</span>
        </section>

        {resultSuggestions.length > 0 && (
          <div className="atlas-search-results">
            {resultSuggestions.map(post => (
              <button type="button" key={post.id} onClick={() => selectPost(post.id)}>
                <span>{post.text.slice(0, 110)}{post.text.length > 110 ? '…' : ''}</span>
                <small>{formatDate(post.date)}</small>
              </button>
            ))}
          </div>
        )}

        {error && <div className="atlas-status">{error}</div>}
        {!data && !error && <div className="atlas-status">Загружаю карту…</div>}
        {data && (
          <div className="atlas-workspace">
            <AtlasCanvas
              allPosts={data.posts}
              visiblePosts={visiblePosts}
              topics={data.topics}
              selectedId={selectedId}
              resetToken={resetToken}
              onSelect={selectPost}
              onHover={setHoveredId}
            />
            <PostPanel
              post={activePost}
              topicsById={topicsById}
              postsById={postsById}
              onSelect={(id) => {
                setQuery('')
                setTopic('all')
                setYear('all')
                selectPost(id)
              }}
            />
          </div>
        )}

        <section className="atlas-legend" aria-label="Темы карты">
          {data?.topics.map(item => (
            <button
              type="button"
              key={item.id}
              className={topic === item.id ? 'is-active' : ''}
              onClick={() => setTopic(current => current === item.id ? 'all' : item.id)}
            >
              <span style={{ backgroundColor: item.color }} />
              {item.label}
              <small>{item.count}</small>
            </button>
          ))}
        </section>

        <p className="atlas-method">
          Координаты рассчитаны из embeddings GBrain: UMAP для карты, cosine kNN для похожих постов. В браузере лежат только готовые точки и связи — без исходных vectors.
        </p>
      </main>
      <Footer />
    </div>
  )
}
