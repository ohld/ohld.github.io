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
type TopicLabelAnchor = AtlasTopic & { x: number; y: number }
type PositionedTopicLabel = TopicLabelAnchor & { left: number; top: number }
type RadiusScale = { low: number; high: number; minRadius: number; maxRadius: number; exponent: number }

const DATA_URL = '/data/telegram-atlas.json'
const TELEGRAM_CHANNEL = 'danokhlopkov'
const LABEL_GRID_SIZE = 8
const PLAYBACK_WINDOW_MONTHS = 6
const PLAYBACK_DURATION_MS = 28_000
const PLAYBACK_FRAME_INTERVAL_MS = 70
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const numberFormatter = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

function postTime(post: AtlasPost) {
  return new Date(`${post.date.slice(0, 10)}T12:00:00Z`).getTime()
}

function formatDate(date: string) {
  const value = new Date(`${date.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(value.getTime()) ? date : dateFormatter.format(value)
}

function formatMonth(value: number) {
  return monthFormatter.format(new Date(value))
}

function subtractMonths(value: number, months: number) {
  const date = new Date(value)
  date.setUTCMonth(date.getUTCMonth() - months)
  return date.getTime()
}

function radiusScale(posts: AtlasPost[]): RadiusScale {
  const values = posts.map(post => Math.max(1, post.views)).sort((left, right) => left - right)
  if (!values.length) return { low: 1, high: 10, minRadius: 1.5, maxRadius: 11, exponent: 1.35 }
  const low = values[Math.floor((values.length - 1) * 0.1)]
  const high = values[Math.floor((values.length - 1) * 0.99)]
  return { low, high: Math.max(low + 1, high), minRadius: 1.5, maxRadius: 11, exponent: 1.35 }
}

function pointRadius(post: AtlasPost, scale: RadiusScale) {
  const low = Math.log1p(scale.low)
  const high = Math.log1p(scale.high)
  const normalized = Math.max(0, Math.min(1, (Math.log1p(Math.max(1, post.views)) - low) / Math.max(0.001, high - low)))
  return scale.minRadius + Math.pow(normalized, scale.exponent) * (scale.maxRadius - scale.minRadius)
}

function telegramPostDeepLink(postId: number) {
  return `tg://resolve?domain=${TELEGRAM_CHANNEL}&post=${postId}`
}

function topicLabelAnchors(posts: AtlasPost[], topics: AtlasTopic[]) {
  const postsByTopic = new Map<string, AtlasPost[]>()
  for (const post of posts) {
    const items = postsByTopic.get(post.topic) || []
    items.push(post)
    postsByTopic.set(post.topic, items)
  }

  return topics.flatMap<TopicLabelAnchor>(topic => {
    const items = postsByTopic.get(topic.id) || []
    if (items.length < 8) return []

    const bins = new Map<string, AtlasPost[]>()
    for (const post of items) {
      const column = Math.min(LABEL_GRID_SIZE - 1, Math.floor(post.x * LABEL_GRID_SIZE))
      const row = Math.min(LABEL_GRID_SIZE - 1, Math.floor(post.y * LABEL_GRID_SIZE))
      const key = `${column}:${row}`
      const bin = bins.get(key) || []
      bin.push(post)
      bins.set(key, bin)
    }
    const densest = [...bins.entries()]
      .sort(([leftKey, left], [rightKey, right]) => right.length - left.length || leftKey.localeCompare(rightKey))[0]?.[1]
    if (!densest?.length) return []

    return [{
      ...topic,
      x: densest.reduce((sum, post) => sum + post.x, 0) / densest.length,
      y: densest.reduce((sum, post) => sum + post.y, 0) / densest.length,
    }]
  })
}

function AtlasCanvas({
  allPosts,
  visiblePosts,
  topics,
  selectedId,
  playbackActive,
  playheadMs,
  playbackWindowStart,
  onSelect,
}: {
  allPosts: AtlasPost[]
  visiblePosts: AtlasPost[]
  topics: AtlasTopic[]
  selectedId: number | null
  playbackActive: boolean
  playheadMs: number
  playbackWindowStart: number
  onSelect: (id: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const zoomControlsRef = useRef<HTMLDivElement>(null)
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
  const pointScale = useMemo(() => radiusScale(allPosts), [allPosts])
  const labelAnchors = useMemo(() => topicLabelAnchors(visiblePosts, topics), [topics, visiblePosts])

  const screenCoordinates = useCallback((x: number, y: number, view = viewRef.current) => {
    const padding = 30
    const worldX = padding + x * Math.max(1, size.width - padding * 2)
    const worldY = padding + y * Math.max(1, size.height - padding * 2)
    return { x: worldX * view.scale + view.x, y: worldY * view.scale + view.y }
  }, [size.height, size.width])

  const screenPoint = useCallback((post: AtlasPost, view = viewRef.current) => (
    screenCoordinates(post.x, post.y, view)
  ), [screenCoordinates])

  const playbackOpacity = useCallback((post: AtlasPost) => {
    if (!playbackActive) return 0.82
    const span = Math.max(1, playheadMs - playbackWindowStart)
    const age = Math.max(0, Math.min(1, (playheadMs - postTime(post)) / span))
    return 0.18 + Math.pow(1 - age, 1.25) * 0.78
  }, [playbackActive, playbackWindowStart, playheadMs])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 1 || size.height <= 1) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    context.clearRect(0, 0, size.width, size.height)

    const background = context.createRadialGradient(
      size.width * 0.52,
      size.height * 0.46,
      Math.min(size.width, size.height) * 0.05,
      size.width * 0.52,
      size.height * 0.46,
      Math.max(size.width, size.height) * 0.7,
    )
    background.addColorStop(0, '#121a24')
    background.addColorStop(0.55, '#0d1219')
    background.addColorStop(1, '#08090c')
    context.fillStyle = background
    context.fillRect(0, 0, size.width, size.height)

    const isFiltered = visiblePosts.length !== allPosts.length
    if (isFiltered) {
      context.fillStyle = 'rgba(255, 255, 255, 0.055)'
      for (const post of allPosts) {
        if (visibleIds.has(post.id)) continue
        const point = screenPoint(post)
        if (point.x < -5 || point.y < -5 || point.x > size.width + 5 || point.y > size.height + 5) continue
        context.beginPath()
        context.arc(point.x, point.y, 1.15, 0, Math.PI * 2)
        context.fill()
      }
    }

    context.save()
    context.lineWidth = 0.6
    for (const post of visiblePosts) {
      const neighbor = post.neighbors.find(item => visibleIds.has(item.id))
      if (!neighbor || post.id > neighbor.id) continue
      const target = postsById.get(neighbor.id)
      if (!target) continue
      const originPoint = screenPoint(post)
      const targetPoint = screenPoint(target)
      context.globalAlpha = playbackOpacity(post) * 0.095
      context.strokeStyle = topicColors.get(post.topic) || '#8295ad'
      context.beginPath()
      context.moveTo(originPoint.x, originPoint.y)
      context.lineTo(targetPoint.x, targetPoint.y)
      context.stroke()
    }
    context.restore()

    context.save()
    context.filter = 'blur(13px)'
    context.globalCompositeOperation = 'screen'
    for (const post of visiblePosts) {
      const point = screenPoint(post)
      if (point.x < -30 || point.y < -30 || point.x > size.width + 30 || point.y > size.height + 30) continue
      const radius = pointRadius(post, pointScale)
      context.globalAlpha = playbackOpacity(post) * 0.2
      context.fillStyle = topicColors.get(post.topic) || '#8295ad'
      context.beginPath()
      context.arc(point.x, point.y, radius * 2.6, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()

    for (const post of visiblePosts) {
      const point = screenPoint(post)
      if (point.x < -15 || point.y < -15 || point.x > size.width + 15 || point.y > size.height + 15) continue
      const selectedPoint = post.id === selectedId
      const radius = pointRadius(post, pointScale) * Math.min(1.45, Math.sqrt(viewRef.current.scale))
      context.globalAlpha = selectedPoint ? 1 : playbackOpacity(post)
      context.fillStyle = topicColors.get(post.topic) || '#8295ad'
      context.beginPath()
      context.arc(point.x, point.y, selectedPoint ? Math.max(8, radius + 2.5) : radius, 0, Math.PI * 2)
      context.fill()
      if (selectedPoint) {
        context.strokeStyle = '#FFFFFF'
        context.lineWidth = 2.5
        context.stroke()
      }
    }
    context.globalAlpha = 1

    const selected = selectedId ? postsById.get(selectedId) : undefined
    if (selected) {
      const origin = screenPoint(selected)
      context.lineWidth = 1.1
      for (const neighbor of selected.neighbors) {
        const target = postsById.get(neighbor.id)
        if (!target) continue
        const point = screenPoint(target)
        context.strokeStyle = `rgba(131, 202, 255, ${Math.max(0.2, neighbor.similarity * 0.58)})`
        context.beginPath()
        context.moveTo(origin.x, origin.y)
        context.lineTo(point.x, point.y)
        context.stroke()
      }
    }

    if (!visiblePosts.length) {
      context.fillStyle = 'rgba(255, 255, 255, 0.58)'
      context.textAlign = 'center'
      context.font = '14px Inter, sans-serif'
      context.fillText('Ничего не найдено', size.width / 2, size.height / 2)
    }
  }, [allPosts, playbackActive, playbackOpacity, pointScale, postsById, screenPoint, selectedId, size, topicColors, visibleIds, visiblePosts])

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

  const findPost = (x: number, y: number) => {
    let best: { id: number; distance: number } | null = null
    for (const post of visiblePosts) {
      const point = screenPoint(post)
      const distance = Math.hypot(point.x - x, point.y - y)
      const threshold = Math.max(9, pointRadius(post, pointScale) + 5)
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
    if (!pointer) return
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const zoomAt = useCallback((factor: number, x = size.width / 2, y = size.height / 2) => {
    const current = viewRef.current
    const nextScale = Math.max(0.76, Math.min(5.5, current.scale * factor))
    const worldX = (x - current.x) / current.scale
    const worldY = (y - current.y) / current.scale
    viewRef.current = {
      scale: nextScale,
      x: x - worldX * nextScale,
      y: y - worldY * nextScale,
    }
    queueRedraw()
  }, [queueRedraw, size.height, size.width])

  const resetView = useCallback(() => {
    viewRef.current = { scale: 1, x: 0, y: 0 }
    queueRedraw()
  }, [queueRedraw])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const delta = Math.max(-180, Math.min(180, event.deltaY))
      const factor = Math.exp(-delta * 0.00135)
      zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top)
    }
    wrapper.addEventListener('wheel', handleWheel, { passive: false })
    return () => wrapper.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  const positionedLabels = useMemo(() => {
    if (viewRef.current.scale > 2.8) return []

    type CollisionBox = { left: number; right: number; top: number; bottom: number }
    const gap = 6
    const placed: CollisionBox[] = []
    const wrapperBounds = wrapperRef.current?.getBoundingClientRect()
    const controlsBounds = zoomControlsRef.current?.getBoundingClientRect()
    if (wrapperBounds && controlsBounds) {
      placed.push({
        left: controlsBounds.left - wrapperBounds.left - gap,
        right: controlsBounds.right - wrapperBounds.left + gap,
        top: controlsBounds.top - wrapperBounds.top - gap,
        bottom: controlsBounds.bottom - wrapperBounds.top + gap,
      })
    }

    const measureContext = document.createElement('canvas').getContext('2d')
    if (measureContext) measureContext.font = '650 11.2px system-ui, sans-serif'
    const offsets: Array<[number, number]> = [[0, 0], [-44, 0], [44, 0], [-88, 0], [88, 0]]
    for (const distance of [26, 52, 78, 104, 130, 156]) {
      offsets.push(
        [0, -distance], [0, distance],
        [-44, -distance], [44, -distance], [-44, distance], [44, distance],
        [-88, -distance], [88, -distance], [-88, distance], [88, distance],
      )
    }
    const orderedAnchors = [...labelAnchors].sort((left, right) => (
      right.label.length - left.label.length || left.id.localeCompare(right.id)
    ))

    return orderedAnchors.map<PositionedTopicLabel>(anchor => {
      const point = screenCoordinates(anchor.x, anchor.y)
      const measuredText = measureContext?.measureText(anchor.label).width ?? anchor.label.length * 6.5
      const width = Math.min(208, Math.ceil(measuredText) + 16)
      const height = 22

      const tryPosition = (candidateX: number, candidateY: number): PositionedTopicLabel | null => {
        const left = Math.max(width / 2 + 8, Math.min(size.width - width / 2 - 8, candidateX))
        const top = Math.max(height / 2 + 7, Math.min(size.height - height / 2 - 7, candidateY))
        const box = {
          left: left - width / 2 - 3,
          right: left + width / 2 + 3,
          top: top - height / 2 - 3,
          bottom: top + height / 2 + 3,
        }
        const collides = placed.some(item => (
          box.left < item.right && box.right > item.left && box.top < item.bottom && box.bottom > item.top
        ))
        if (collides) return null
        placed.push(box)
        return { ...anchor, left, top }
      }

      for (const [offsetX, offsetY] of offsets) {
        const position = tryPosition(point.x + offsetX, point.y + offsetY)
        if (position) return position
      }

      const globalCandidates: Array<{ x: number; y: number; distance: number }> = []
      for (let y = height / 2 + 7; y <= size.height - height / 2 - 7; y += height + 8) {
        for (let x = width / 2 + 8; x <= size.width - width / 2 - 8; x += 36) {
          globalCandidates.push({ x, y, distance: Math.hypot(x - point.x, y - point.y) })
        }
      }
      globalCandidates.sort((left, right) => left.distance - right.distance)
      for (const candidate of globalCandidates) {
        const position = tryPosition(candidate.x, candidate.y)
        if (position) return position
      }

      return { ...anchor, left: -width, top: -height }
    })
  }, [labelAnchors, screenCoordinates, size.height, size.width, viewVersion])

  return (
    <div className="atlas-canvas-wrap" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="atlas-canvas"
        aria-label="Смысловая карта постов @danokhlopkov. Цвет показывает тему, расстояние — близость текстов, размер — просмотры."
        role="img"
        data-visible-posts={visiblePosts.length}
        data-total-posts={allPosts.length}
        data-view-scale={viewRef.current.scale.toFixed(3)}
        data-min-radius={pointScale.minRadius}
        data-max-radius={pointScale.maxRadius}
        data-radius-low-views={pointScale.low}
        data-radius-high-views={pointScale.high}
        data-radius-exponent={pointScale.exponent}
        data-playback-active={playbackActive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerRef.current = null }}
      />
      {positionedLabels.length > 0 && (
        <div className="atlas-map-labels" aria-hidden="true">
          {positionedLabels.map(label => (
            <span
              className="atlas-map-label"
              key={label.id}
              style={{ left: label.left, top: label.top, '--topic-color': label.color } as React.CSSProperties}
            >
              {label.label}
            </span>
          ))}
        </div>
      )}
      <div className="atlas-zoom-controls" aria-label="Масштаб карты" ref={zoomControlsRef}>
        <button type="button" onClick={() => zoomAt(1.14)} aria-label="Приблизить">+</button>
        <button type="button" onClick={() => zoomAt(0.88)} aria-label="Отдалить">−</button>
        <button type="button" onClick={resetView} aria-label="Сбросить масштаб">↺</button>
      </div>
    </div>
  )
}

function PostPanel({
  post,
  topicsById,
  postsById,
  onSelect,
  onClose,
}: {
  post: AtlasPost | null
  topicsById: Map<string, AtlasTopic>
  postsById: Map<number, AtlasPost>
  onSelect: (id: number) => void
  onClose: () => void
}) {
  if (!post) return null

  const topic = topicsById.get(post.topic)
  const telegramDeepLink = telegramPostDeepLink(post.id)
  return (
    <aside className="atlas-detail" aria-live="polite">
      <button type="button" className="atlas-detail-close" onClick={onClose} aria-label="Закрыть карточку">×</button>
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
      <div className="atlas-telegram-actions">
        <a
          className="atlas-telegram-link"
          href={telegramDeepLink}
          rel="noreferrer"
          onClick={(event) => {
            if (!window.__IS_TMA__ || !window.__openUrl__) return
            event.preventDefault()
            window.__openUrl__(post.url)
          }}
        >
          Открыть в приложении Telegram ↗
        </a>
        <a className="atlas-telegram-web-link" href={post.url} target="_blank" rel="noreferrer">
          Нет приложения? Открыть t.me ↗
        </a>
      </div>
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
  const [timelineActive, setTimelineActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadMs, setPlayheadMs] = useState<number | null>(null)
  const playheadRef = useRef<number | null>(null)
  const playbackFrameRef = useRef<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    return value && /^\d+$/.test(value) ? Number(value) : null
  })


  useDocumentMeta({
    title: 'Смысловая карта Telegram — Даниил Охлопков',
    description: 'Интерактивная карта 1 500+ постов @danokhlopkov: темы, поиск и эволюция интересов во времени.',
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
  const years = useMemo(() => [...new Set((data?.posts || []).map(post => post.year))].sort((left, right) => right - left), [data])
  const timelineBounds = useMemo(() => {
    const times = (data?.posts || []).map(postTime)
    if (!times.length) return { min: Date.now(), max: Date.now() }
    return { min: Math.min(...times), max: Math.max(...times) }
  }, [data])
  const effectivePlayhead = Math.max(timelineBounds.min, Math.min(timelineBounds.max, playheadMs ?? timelineBounds.max))
  const playbackWindowStart = subtractMonths(effectivePlayhead, PLAYBACK_WINDOW_MONTHS)

  useEffect(() => {
    playheadRef.current = playheadMs
  }, [playheadMs])

  const visiblePosts = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLocaleLowerCase('ru-RU')
    return data.posts.filter(post => {
      if (topic !== 'all' && post.topic !== topic) return false
      if (!timelineActive && year !== 'all' && post.year !== Number(year)) return false
      if (timelineActive) {
        const time = postTime(post)
        if (time > effectivePlayhead || time < playbackWindowStart) return false
      }
      if (!needle) return true
      const topicLabel = topicsById.get(post.topic)?.label || ''
      return post.text.toLocaleLowerCase('ru-RU').includes(needle)
        || topicLabel.toLocaleLowerCase('ru-RU').includes(needle)
        || String(post.id) === needle
    })
  }, [data, effectivePlayhead, playbackWindowStart, query, timelineActive, topic, topicsById, year])

  useEffect(() => {
    if (!isPlaying || !data) return
    const currentValue = playheadRef.current ?? timelineBounds.max
    const startValue = currentValue >= timelineBounds.max - 86_400_000 ? timelineBounds.min : currentValue
    if (startValue !== currentValue) {
      playheadRef.current = startValue
      setPlayheadMs(startValue)
    }
    const startedAt = performance.now()
    const duration = Math.max(600, PLAYBACK_DURATION_MS * ((timelineBounds.max - startValue) / Math.max(1, timelineBounds.max - timelineBounds.min)))
    let lastPaint = -Infinity

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      if (now - lastPaint >= PLAYBACK_FRAME_INTERVAL_MS || progress === 1) {
        const nextValue = startValue + (timelineBounds.max - startValue) * progress
        playheadRef.current = nextValue
        setPlayheadMs(nextValue)
        lastPaint = now
      }
      if (progress >= 1) {
        setIsPlaying(false)
        playbackFrameRef.current = null
        return
      }
      playbackFrameRef.current = window.requestAnimationFrame(tick)
    }

    playbackFrameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (playbackFrameRef.current !== null) window.cancelAnimationFrame(playbackFrameRef.current)
      playbackFrameRef.current = null
    }
  }, [data, isPlaying, timelineBounds.max, timelineBounds.min])

  useEffect(() => () => {
    if (playbackFrameRef.current !== null) window.cancelAnimationFrame(playbackFrameRef.current)
  }, [])

  useEffect(() => {
    if (!data || !selectedId || visiblePosts.some(post => post.id === selectedId)) return
    setSelectedId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('post')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [data, selectedId, visiblePosts])

  const selectPost = useCallback((id: number) => {
    setSelectedId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('post', String(id))
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const closePost = useCallback(() => {
    setSelectedId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('post')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const chooseYear = (value: string) => {
    setIsPlaying(false)
    setTimelineActive(false)
    setYear(value)
  }

  const togglePlayback = () => {
    setYear('all')
    setTimelineActive(true)
    if (!isPlaying && effectivePlayhead >= timelineBounds.max - 86_400_000) setPlayheadMs(timelineBounds.min)
    setIsPlaying(current => !current)
  }

  const showAllHistory = () => {
    setIsPlaying(false)
    setTimelineActive(false)
    setPlayheadMs(timelineBounds.max)
    setYear('all')
  }

  const activePost = postsById.get(selectedId || -1) || null
  const resultSuggestions = query.trim() ? visiblePosts.slice(0, 6) : []
  const timelineProgress = Math.round(((effectivePlayhead - timelineBounds.min) / Math.max(1, timelineBounds.max - timelineBounds.min)) * 1000)

  return (
    <div className="page atlas-page">
      <header className="atlas-header">
        <BackButton />
        <div>
          <h1>Смысловая карта Telegram</h1>
          <p className="atlas-meta">@danokhlopkov · 1 556 постов · 2020–2026</p>
        </div>
      </header>

      <main className="atlas-shell">
        <section className="atlas-controls" aria-label="Фильтры и время карты">
          <div className="atlas-search-row">
            <label className="atlas-search">
              <span className="sr-only">Поиск по постам</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти пост или тему" />
            </label>
            <button type="button" className={`atlas-play-button${isPlaying ? ' is-playing' : ''}`} onClick={togglePlayback}>
              {isPlaying ? 'Ⅱ Пауза' : '▶ Эволюция'}
            </button>
            <button type="button" className="atlas-history-button" onClick={showAllHistory} disabled={!timelineActive}>
              Вся история
            </button>
          </div>

          <div className="atlas-filter-row atlas-year-filters" aria-label="Фильтр по годам">
            <button type="button" data-year="all" className={!timelineActive && year === 'all' ? 'is-active' : ''} onClick={() => chooseYear('all')}>Все годы</button>
            {years.map(item => (
              <button
                type="button"
                data-year={item}
                key={item}
                className={!timelineActive && year === String(item) ? 'is-active' : ''}
                onClick={() => chooseYear(String(item))}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="atlas-filter-row atlas-topic-filters" aria-label="Фильтр по темам">
            <button type="button" className={topic === 'all' ? 'is-active' : ''} onClick={() => setTopic('all')}>Все темы</button>
            {data?.topics.map(item => (
              <button
                type="button"
                key={item.id}
                className={topic === item.id ? 'is-active' : ''}
                onClick={() => setTopic(current => current === item.id ? 'all' : item.id)}
                style={{ '--topic-color': item.color } as React.CSSProperties}
              >
                <span />{item.label}
              </button>
            ))}
          </div>

          <div className={`atlas-timeline${timelineActive ? ' is-active' : ''}`}>
            <span>{years.at(-1) || '2020'}</span>
            <input
              type="range"
              min="0"
              max="1000"
              value={timelineProgress}
              aria-label="Временная шкала постов"
              onChange={event => {
                const progress = Number(event.target.value) / 1000
                setIsPlaying(false)
                setTimelineActive(true)
                setYear('all')
                setPlayheadMs(timelineBounds.min + (timelineBounds.max - timelineBounds.min) * progress)
              }}
            />
            <strong className="atlas-playback-date">{timelineActive ? formatMonth(effectivePlayhead) : 'Вся история'}</strong>
            <span>{years[0] || '2026'}</span>
          </div>
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
              playbackActive={timelineActive}
              playheadMs={effectivePlayhead}
              playbackWindowStart={playbackWindowStart}
              onSelect={selectPost}
            />
            <PostPanel
              post={activePost}
              topicsById={topicsById}
              postsById={postsById}
              onClose={closePost}
              onSelect={(id) => {
                setQuery('')
                setTopic('all')
                showAllHistory()
                selectPost(id)
              }}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
