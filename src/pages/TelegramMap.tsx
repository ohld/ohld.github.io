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
type CareerRole = { company: string; role: string; start: number; end: number }
type TopicWindowStat = AtlasTopic & { count: number; share: number }
type TopicPopularityStat = AtlasTopic & { share: number; weight: number }
type PointSprite = { canvas: HTMLCanvasElement; width: number; height: number }

const DATA_URL = '/data/telegram-atlas.json'
const TELEGRAM_CHANNEL = 'danokhlopkov'
const LABEL_GRID_SIZE = 8
const PLAYBACK_WINDOW_MONTHS = 6
const PLAYBACK_DURATION_MS = 28_000
const PLAYBACK_FRAME_INTERVAL_MS = 70
const MAX_CANVAS_DPR = 1.5
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const numberFormatter = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })
const CAREER_ROLES: CareerRole[] = [
  { company: 'TON Foundation', role: 'Head of Analytics', start: Date.parse('2025-09-01T00:00:00Z'), end: Date.parse('2100-01-01T00:00:00Z') },
  { company: 'TON Foundation', role: 'Research Analyst', start: Date.parse('2024-12-01T00:00:00Z'), end: Date.parse('2025-11-01T00:00:00Z') },
  { company: 'sequel', role: 'Senior Data Scientist', start: Date.parse('2024-01-01T00:00:00Z'), end: Date.parse('2024-12-01T00:00:00Z') },
  { company: 'Entrepreneur First', role: 'Founder In Residence', start: Date.parse('2023-09-01T00:00:00Z'), end: Date.parse('2024-01-01T00:00:00Z') },
  { company: 'Via Protocol', role: 'Data Advisor', start: Date.parse('2023-03-01T00:00:00Z'), end: Date.parse('2023-06-01T00:00:00Z') },
  { company: 'Via Protocol', role: 'Co-Founder, CTO', start: Date.parse('2021-08-01T00:00:00Z'), end: Date.parse('2023-04-01T00:00:00Z') },
  { company: 'Runa Capital', role: 'Data Lead', start: Date.parse('2021-01-01T00:00:00Z'), end: Date.parse('2022-02-01T00:00:00Z') },
  { company: 'Sweatcoin', role: 'Lead Data Scientist', start: Date.parse('2018-01-01T00:00:00Z'), end: Date.parse('2020-02-01T00:00:00Z') },
  { company: 'Double Data', role: 'Data Scientist', start: Date.parse('2016-09-01T00:00:00Z'), end: Date.parse('2017-06-01T00:00:00Z') },
]

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

function colorWithAlpha(color: string, alpha: number) {
  const value = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(value)) return color
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function atlasBackgroundColor(x: number, y: number, width: number, height: number) {
  const centerX = width * 0.52
  const centerY = height * 0.46
  const innerRadius = Math.min(width, height) * 0.05
  const outerRadius = Math.max(width, height) * 0.7
  const position = Math.max(0, Math.min(1, (Math.hypot(x - centerX, y - centerY) - innerRadius) / Math.max(1, outerRadius - innerRadius)))
  const start = position <= 0.55 ? [18, 26, 36] : [13, 18, 25]
  const end = position <= 0.55 ? [13, 18, 25] : [8, 9, 12]
  const progress = position <= 0.55 ? position / 0.55 : (position - 0.55) / 0.45
  const channels = start.map((channel, index) => Math.round(channel + (end[index] - channel) * progress))
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
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
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View>({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map<number, { originX: number; originY: number; x: number; y: number; moved: boolean }>())
  const redrawFrameRef = useRef<number | null>(null)
  const pointSpritesRef = useRef(new Map<string, PointSprite>())
  const pointSpriteDprRef = useRef(1)
  const [size, setSize] = useState<CanvasSize>({ width: 1, height: 1, dpr: 1 })
  const [viewVersion, setViewVersion] = useState(0)
  const [playbackLabelIds, setPlaybackLabelIds] = useState<string[]>([])

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
  const isFiltered = visiblePosts.length !== allPosts.length
  const pointScale = useMemo(() => radiusScale(allPosts), [allPosts])
  const visibleLabelAnchors = useMemo(() => topicLabelAnchors(visiblePosts, topics), [topics, visiblePosts])
  const stableLabelAnchors = useMemo(() => topicLabelAnchors(allPosts, topics), [allPosts, topics])
  const visibleLabelKey = useMemo(() => visibleLabelAnchors.map(label => label.id).sort().join('|'), [visibleLabelAnchors])

  useEffect(() => {
    setPlaybackLabelIds(current => {
      if (!playbackActive) return current.length ? [] : current
      const next = new Set(current)
      if (visibleLabelKey) visibleLabelKey.split('|').forEach(id => next.add(id))
      if (next.size === current.length) return current
      return [...next].sort()
    })
  }, [playbackActive, visibleLabelKey])

  const playbackLabelIdSet = useMemo(() => new Set(playbackLabelIds), [playbackLabelIds])
  const placementAnchors = playbackActive ? stableLabelAnchors : visibleLabelAnchors
  const labelPopularity = useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of visiblePosts) counts.set(post.topic, (counts.get(post.topic) || 0) + 1)
    const totalPosts = Math.max(1, visiblePosts.length)
    const maxCount = Math.max(1, ...counts.values())
    return new Map(topics.map(topic => {
      const count = counts.get(topic.id) || 0
      return [topic.id, {
        count,
        share: count / totalPosts * 100,
        weight: count / maxCount * 100,
      }]
    }))
  }, [topics, visiblePosts])

  const screenCoordinates = useCallback((x: number, y: number, view = viewRef.current) => {
    const padding = 30
    const worldX = padding + x * Math.max(1, size.width - padding * 2)
    const worldY = padding + y * Math.max(1, size.height - padding * 2)
    return { x: worldX * view.scale + view.x, y: worldY * view.scale + view.y }
  }, [size.height, size.width])

  const screenPoint = useCallback((post: AtlasPost, view = viewRef.current) => (
    screenCoordinates(post.x, post.y, view)
  ), [screenCoordinates])

  const backgroundMaskColors = useMemo(() => new Map(allPosts.map(post => {
    const point = screenPoint(post)
    return [post.id, atlasBackgroundColor(point.x, point.y, size.width, size.height)]
  })), [allPosts, screenPoint, size.height, size.width, viewVersion])

  const playbackOpacity = useCallback((post: AtlasPost) => {
    if (!playbackActive) return 0.82
    const span = Math.max(1, playheadMs - playbackWindowStart)
    const age = Math.max(0, Math.min(1, (playheadMs - postTime(post)) / span))
    return 0.18 + Math.pow(1 - age, 1.25) * 0.78
  }, [playbackActive, playbackWindowStart, playheadMs])

  const getPointSprite = useCallback((color: string, drawRadius: number) => {
    if (pointSpriteDprRef.current !== size.dpr) {
      pointSpritesRef.current.clear()
      pointSpriteDprRef.current = size.dpr
    }
    const radius = Math.max(0.5, Math.round(drawRadius * 2) / 2)
    const key = `${size.dpr}:${color}:${radius.toFixed(1)}`
    const cached = pointSpritesRef.current.get(key)
    if (cached) return cached

    const padding = 2
    const requestedSize = radius * 2 + padding * 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.ceil(requestedSize * size.dpr))
    canvas.height = Math.max(1, Math.ceil(requestedSize * size.dpr))
    const width = canvas.width / size.dpr
    const height = canvas.height / size.dpr
    const context = canvas.getContext('2d')
    if (context) {
      const centerX = width / 2
      const centerY = height / 2
      context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
      const gradient = context.createRadialGradient(
        centerX - radius * 0.22,
        centerY - radius * 0.24,
        0,
        centerX,
        centerY,
        radius,
      )
      gradient.addColorStop(0, colorWithAlpha(color, 1))
      gradient.addColorStop(0.38, colorWithAlpha(color, 0.92))
      gradient.addColorStop(0.74, colorWithAlpha(color, 0.42))
      gradient.addColorStop(1, colorWithAlpha(color, 0))
      context.fillStyle = gradient
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, Math.PI * 2)
      context.fill()
    }
    const sprite = { canvas, width, height }
    pointSpritesRef.current.set(key, sprite)
    return sprite
  }, [size.dpr])

  const redrawBackground = useCallback(() => {
    const canvas = backgroundCanvasRef.current
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

    if (isFiltered) {
      context.fillStyle = 'rgba(255, 255, 255, 0.055)'
      for (const post of allPosts) {
        const point = screenPoint(post)
        if (point.x < -5 || point.y < -5 || point.x > size.width + 5 || point.y > size.height + 5) continue
        context.beginPath()
        context.arc(point.x, point.y, 1.15, 0, Math.PI * 2)
        context.fill()
      }
    }
  }, [allPosts, isFiltered, screenPoint, size])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 1 || size.height <= 1) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    context.clearRect(0, 0, size.width, size.height)
    context.globalAlpha = 1

    if (isFiltered) {
      const maskSize = 3.5
      for (const post of visiblePosts) {
        const point = screenPoint(post)
        if (point.x < -maskSize || point.y < -maskSize || point.x > size.width + maskSize || point.y > size.height + maskSize) continue
        context.fillStyle = backgroundMaskColors.get(post.id) || '#0d1219'
        context.fillRect(point.x - maskSize / 2, point.y - maskSize / 2, maskSize, maskSize)
      }
    }

    context.save()
    context.lineWidth = playbackActive ? 0.75 : 0.45
    for (const post of visiblePosts) {
      const neighbor = post.neighbors.find(item => visibleIds.has(item.id))
      if (!neighbor || post.id > neighbor.id) continue
      const target = postsById.get(neighbor.id)
      if (!target) continue
      const originPoint = screenPoint(post)
      const targetPoint = screenPoint(target)
      const color = topicColors.get(post.topic) || '#8295ad'
      context.globalAlpha = playbackActive
        ? playbackOpacity(post) * (0.18 + neighbor.similarity * 0.12)
        : 0.065
      context.strokeStyle = color
      context.beginPath()
      context.moveTo(originPoint.x, originPoint.y)
      context.lineTo(targetPoint.x, targetPoint.y)
      context.stroke()

      if (playbackActive) {
        const flow = ((playheadMs / 1_400) + (post.id % 97) / 97) % 1
        const flowX = originPoint.x + (targetPoint.x - originPoint.x) * flow
        const flowY = originPoint.y + (targetPoint.y - originPoint.y) * flow
        context.globalAlpha = playbackOpacity(post) * 0.72
        context.fillStyle = color
        context.beginPath()
        context.arc(flowX, flowY, 1.35, 0, Math.PI * 2)
        context.fill()
      }
    }
    context.restore()

    for (const post of visiblePosts) {
      const point = screenPoint(post)
      if (point.x < -24 || point.y < -24 || point.x > size.width + 24 || point.y > size.height + 24) continue
      const selectedPoint = post.id === selectedId
      const radius = pointRadius(post, pointScale) * Math.min(1.45, Math.sqrt(viewRef.current.scale))
      const drawRadius = selectedPoint ? Math.max(10, radius * 1.45) : Math.max(2.5, radius * 1.65)
      const color = topicColors.get(post.topic) || '#8295ad'
      const sprite = getPointSprite(color, drawRadius)
      context.globalAlpha = selectedPoint ? 1 : playbackOpacity(post)
      context.drawImage(sprite.canvas, point.x - sprite.width / 2, point.y - sprite.height / 2, sprite.width, sprite.height)
      if (selectedPoint) {
        context.strokeStyle = '#FFFFFF'
        context.lineWidth = 2
        context.beginPath()
        context.arc(point.x, point.y, drawRadius, 0, Math.PI * 2)
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
  }, [backgroundMaskColors, getPointSprite, isFiltered, playbackActive, playbackOpacity, pointScale, postsById, screenPoint, selectedId, size, topicColors, visibleIds, visiblePosts])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current
    if (!wrapper || !canvas || !backgroundCanvas) return
    const update = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR)
      for (const layer of [backgroundCanvas, canvas]) {
        layer.width = Math.max(1, Math.round(rect.width * dpr))
        layer.height = Math.max(1, Math.round(rect.height * dpr))
      }
      setSize({ width: rect.width, height: rect.height, dpr })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(wrapper)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(redrawBackground, [redrawBackground, viewVersion])
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
    const pointers = pointersRef.current
    pointers.set(event.pointerId, { originX: point.x, originY: point.y, ...point, moved: false })
    if (pointers.size > 1) {
      for (const pointer of pointers.values()) pointer.moved = true
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointers = pointersRef.current
    const pointer = pointers.get(event.pointerId)
    if (!pointer) return
    const point = pointerPosition(event)
    const before = [...pointers.values()].map(item => ({ x: item.x, y: item.y }))
    pointer.x = point.x
    pointer.y = point.y

    if (pointers.size >= 2) {
      const after = [...pointers.values()].map(item => ({ x: item.x, y: item.y }))
      const previousDistance = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y)
      const nextDistance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y)
      if (previousDistance > 0 && nextDistance > 0) {
        const previousCenter = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 }
        const nextCenter = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 }
        const current = viewRef.current
        const nextScale = Math.max(0.76, Math.min(5.5, current.scale * nextDistance / previousDistance))
        const worldX = (previousCenter.x - current.x) / current.scale
        const worldY = (previousCenter.y - current.y) / current.scale
        viewRef.current = {
          scale: nextScale,
          x: nextCenter.x - worldX * nextScale,
          y: nextCenter.y - worldY * nextScale,
        }
        queueRedraw()
      }
      return
    }

    const dx = point.x - before[0].x
    const dy = point.y - before[0].y
    if (Math.hypot(point.x - pointer.originX, point.y - pointer.originY) > 5) pointer.moved = true
    if (pointer.moved) {
      viewRef.current.x += dx
      viewRef.current.y += dy
      queueRedraw()
    }
  }

  const releasePointer = (event: React.PointerEvent<HTMLCanvasElement>, allowSelection: boolean) => {
    const point = pointerPosition(event)
    const pointers = pointersRef.current
    const pointer = pointers.get(event.pointerId)
    if (allowSelection && pointers.size === 1 && pointer && !pointer.moved) {
      const id = findPost(point.x, point.y)
      if (id) onSelect(id)
    }
    pointers.delete(event.pointerId)
    for (const remaining of pointers.values()) {
      remaining.originX = remaining.x
      remaining.originY = remaining.y
      remaining.moved = true
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => releasePointer(event, true)
  const onPointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => releasePointer(event, false)

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

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const containMapTouch = (event: TouchEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('.atlas-detail')) return
      if (event.cancelable) event.preventDefault()
    }
    wrapper.addEventListener('touchmove', containMapTouch, { passive: false })
    return () => wrapper.removeEventListener('touchmove', containMapTouch)
  }, [])

  const positionedLabels = useMemo(() => {
    if (viewRef.current.scale > 2.8) return []

    type CollisionBox = { left: number; right: number; top: number; bottom: number }
    const placed: CollisionBox[] = []

    const measureContext = document.createElement('canvas').getContext('2d')
    if (measureContext) measureContext.font = '720 13.6px system-ui, sans-serif'
    const offsets: Array<[number, number]> = [[0, 0], [-44, 0], [44, 0], [-88, 0], [88, 0]]
    for (const distance of [26, 52, 78, 104, 130, 156]) {
      offsets.push(
        [0, -distance], [0, distance],
        [-44, -distance], [44, -distance], [-44, distance], [44, distance],
        [-88, -distance], [88, -distance], [-88, distance], [88, distance],
      )
    }
    const orderedAnchors = [...placementAnchors].sort((left, right) => (
      right.label.length - left.label.length || left.id.localeCompare(right.id)
    ))

    const placedLabels = orderedAnchors.map<PositionedTopicLabel>(anchor => {
      const point = screenCoordinates(anchor.x, anchor.y)
      const measuredText = measureContext?.measureText(anchor.label).width ?? anchor.label.length * 6.5
      const width = Math.min(208, Math.ceil(measuredText) + 16)
      const height = 25

      const tryPosition = (candidateX: number, candidateY: number): PositionedTopicLabel | null => {
        const reservedTop = 7
        const left = Math.max(width / 2 + 8, Math.min(size.width - width / 2 - 8, candidateX))
        const top = Math.max(reservedTop + height / 2, Math.min(size.height - height / 2 - 7, candidateY))
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

    return playbackActive
      ? placedLabels.filter(label => playbackLabelIdSet.has(label.id))
      : placedLabels
  }, [placementAnchors, playbackActive, playbackLabelIdSet, screenCoordinates, size.height, size.width, viewVersion])

  return (
    <div className="atlas-canvas-wrap" ref={wrapperRef}>
      <canvas ref={backgroundCanvasRef} className="atlas-canvas-background" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="atlas-canvas"
        aria-label="Смысловая карта постов @danokhlopkov. Цвет показывает тему, расстояние — близость текстов, размер — просмотры."
        role="img"
        data-visible-posts={visiblePosts.length}
        data-total-posts={allPosts.length}
        data-view-scale={viewRef.current.scale.toFixed(3)}
        data-render-dpr={size.dpr}
        data-min-radius={pointScale.minRadius}
        data-max-radius={pointScale.maxRadius}
        data-radius-low-views={pointScale.low}
        data-radius-high-views={pointScale.high}
        data-radius-exponent={pointScale.exponent}
        data-point-rendering="radial-gradient"
        data-render-strategy="layered-canvases-and-point-sprites"
        data-visible-ghost-policy="masked"
        data-layout-mode="fixed-semantic"
        data-graph-mode={playbackActive ? 'similarity-flow' : 'static-neighbors'}
        data-playback-active={playbackActive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      {positionedLabels.length > 0 && (
        <div className="atlas-map-labels" aria-hidden="true">
          {positionedLabels.map(label => {
            const popularity = labelPopularity.get(label.id) || { count: 0, share: 0, weight: 0 }
            return (
              <span
                className="atlas-map-label"
                key={label.id}
                data-topic-count={popularity.count}
                data-topic-share={popularity.share.toFixed(2)}
                data-topic-weight={Math.round(popularity.weight)}
                style={{
                  left: label.left,
                  top: label.top,
                  '--topic-color': label.color,
                  '--topic-popularity': popularity.weight / 100,
                } as React.CSSProperties}
              >
                {label.label}
              </span>
            )
          })}
        </div>
      )}
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
  const [timelineActive, setTimelineActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadMs, setPlayheadMs] = useState<number | null>(null)
  const playheadRef = useRef<number | null>(null)
  const timelineInputRef = useRef<HTMLInputElement | null>(null)
  const playbackFrameRef = useRef<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    return value && /^\d+$/.test(value) ? Number(value) : null
  })


  useDocumentMeta({
    title: 'Карта моих постов в Telegram — Даниил Охлопков',
    description: 'Интерактивная карта 1 556 постов @danokhlopkov за 2020–2026 годы: темы, связи, поиск и эволюция интересов.',
    canonical: absoluteUrl('/karta-postov-telegram/'),
    lang: 'ru',
    alternates: { ru: absoluteUrl('/karta-postov-telegram/'), 'x-default': absoluteUrl('/karta-postov-telegram/') },
    image: absoluteUrl('/assets/blog/karta-postov-telegram/telegram-posts-map-cover-20260720.webp'),
    imageAlt: 'Два графика с подписями «Мои посты» и «Карта Telegram»',
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

  useEffect(() => {
    document.documentElement.classList.add('atlas-map-active')
    document.body.classList.add('atlas-map-active')
    return () => {
      document.documentElement.classList.remove('atlas-map-active')
      document.body.classList.remove('atlas-map-active')
    }
  }, [])

  const topicsById = useMemo(() => new Map((data?.topics || []).map(item => [item.id, item])), [data])
  const postsById = useMemo(() => new Map((data?.posts || []).map(item => [item.id, item])), [data])
  const topicPopularity = useMemo<TopicPopularityStat[]>(() => {
    if (!data?.topics.length) return []
    const totalPosts = Math.max(1, data.posts.length)
    const maxCount = Math.max(1, ...data.topics.map(item => item.count))
    return data.topics
      .map(item => ({
        ...item,
        share: item.count / totalPosts * 100,
        weight: item.count / maxCount * 100,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'ru-RU'))
  }, [data])
  const timelineBounds = useMemo(() => {
    const times = (data?.posts || []).map(postTime)
    if (!times.length) return { min: Date.now(), max: Date.now() }
    return { min: Math.min(...times), max: Math.max(...times) }
  }, [data])
  const timelineStartYear = new Date(timelineBounds.min).getUTCFullYear()
  const timelineEndYear = new Date(timelineBounds.max).getUTCFullYear()
  const effectivePlayhead = Math.max(timelineBounds.min, Math.min(timelineBounds.max, playheadMs ?? timelineBounds.max))
  const playbackWindowStart = subtractMonths(effectivePlayhead, PLAYBACK_WINDOW_MONTHS)
  const activeCareer = useMemo(() => {
    const companies = new Set<string>()
    return CAREER_ROLES.filter(item => item.start <= effectivePlayhead && effectivePlayhead < item.end)
      .filter(item => {
        if (companies.has(item.company)) return false
        companies.add(item.company)
        return true
      })
  }, [effectivePlayhead])
  const careerCompanies = activeCareer.map(item => item.company).join(' + ')
  const windowTopicStats = useMemo<TopicWindowStat[]>(() => {
    if (!data) return []
    const currentCounts = new Map<string, number>()
    let currentTotal = 0
    for (const post of data.posts) {
      const time = postTime(post)
      if (time >= playbackWindowStart && time <= effectivePlayhead) {
        currentCounts.set(post.topic, (currentCounts.get(post.topic) || 0) + 1)
        currentTotal += 1
      }
    }
    return data.topics.map(item => {
      const count = currentCounts.get(item.id) || 0
      const share = currentTotal ? count / currentTotal * 100 : 0
      return { ...item, count, share }
    }).sort((left, right) => right.share - left.share || right.count - left.count)
  }, [data, effectivePlayhead, playbackWindowStart])
  const leadingTopic = windowTopicStats.find(item => item.count > 0)

  useEffect(() => {
    playheadRef.current = playheadMs
  }, [playheadMs])

  const visiblePosts = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLocaleLowerCase('ru-RU')
    return data.posts.filter(post => {
      if (!timelineActive && topic !== 'all' && post.topic !== topic) return false
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
  }, [data, effectivePlayhead, playbackWindowStart, query, timelineActive, topic, topicsById])

  useEffect(() => {
    if (!isPlaying || !data) return
    const currentValue = playheadRef.current ?? timelineBounds.max
    if (currentValue >= timelineBounds.max - 86_400_000) {
      playheadRef.current = timelineBounds.min
      setPlayheadMs(timelineBounds.min)
    }
    const playbackRate = (timelineBounds.max - timelineBounds.min) / PLAYBACK_DURATION_MS
    let previousTick = performance.now()
    let lastPaint = -Infinity

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - previousTick)
      previousTick = now
      const currentPlayhead = playheadRef.current ?? timelineBounds.min
      const nextValue = Math.min(timelineBounds.max, currentPlayhead + elapsed * playbackRate)
      playheadRef.current = nextValue
      if (now - lastPaint >= PLAYBACK_FRAME_INTERVAL_MS || nextValue >= timelineBounds.max) {
        setPlayheadMs(nextValue)
        lastPaint = now
      }
      if (nextValue >= timelineBounds.max) {
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
    setIsPlaying(false)
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

  const seekTimeline = useCallback((progressValue: number) => {
    const boundedProgress = Math.max(0, Math.min(1000, progressValue))
    const nextPlayhead = timelineBounds.min + (timelineBounds.max - timelineBounds.min) * (boundedProgress / 1000)
    playheadRef.current = nextPlayhead
    setTimelineActive(true)
    setPlayheadMs(nextPlayhead)
  }, [timelineBounds.max, timelineBounds.min])

  const togglePlayback = () => {
    setTimelineActive(true)
    if (!isPlaying && effectivePlayhead >= timelineBounds.max - 86_400_000) {
      playheadRef.current = timelineBounds.min
      setPlayheadMs(timelineBounds.min)
    }
    setIsPlaying(current => !current)
  }

  const showAllHistory = () => {
    setIsPlaying(false)
    setTimelineActive(false)
    playheadRef.current = timelineBounds.max
    setPlayheadMs(timelineBounds.max)
  }

  useEffect(() => {
    const input = timelineInputRef.current
    if (!input || !data) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const currentPlayhead = playheadRef.current ?? timelineBounds.max
      const currentProgress = ((currentPlayhead - timelineBounds.min) / Math.max(1, timelineBounds.max - timelineBounds.min)) * 1000
      seekTimeline(currentProgress + delta * 0.75)
    }
    input.addEventListener('wheel', handleWheel, { passive: false })
    return () => input.removeEventListener('wheel', handleWheel)
  }, [data, seekTimeline, timelineBounds.max, timelineBounds.min])

  const activePost = postsById.get(selectedId || -1) || null
  const resultSuggestions = query.trim() ? visiblePosts.slice(0, 6) : []
  const timelineProgress = Math.round(((effectivePlayhead - timelineBounds.min) / Math.max(1, timelineBounds.max - timelineBounds.min)) * 1000)

  return (
    <div className="page atlas-page">
      <header className="atlas-header">
        <BackButton />
        <div>
          <h1>Карта моих постов в Telegram</h1>
          <p className="atlas-meta">@danokhlopkov · 1 556 постов · 2020–2026</p>
          <p className="sr-only">
            Интерактивная карта тем, связей и эволюции публикаций. Перемещайте временную шкалу,
            чтобы увидеть главные темы выбранного периода, их доли и карьерный контекст автора.
          </p>
        </div>
      </header>

      <main className="atlas-shell">
        <section className="atlas-controls" aria-label="Поиск и управление картой">
          <div className="atlas-search-row">
            <label className="atlas-search">
              <span className="sr-only">Поиск по постам</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти пост или тему" />
            </label>
            <button type="button" className={`atlas-play-button${isPlaying ? ' is-playing' : ''}`} onClick={togglePlayback}>
              {isPlaying ? 'Ⅱ Пауза' : timelineActive ? '▶ Продолжить' : '▶ Эволюция'}
            </button>
            {timelineActive && (
              <button type="button" className="atlas-history-button" onClick={showAllHistory}>
                Вся история
              </button>
            )}
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
          <div className="atlas-map-block">
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

            <section className={`atlas-lower-panel${timelineActive ? ' is-playback' : ''}`} aria-label="Время и контекст карты">
              <div className={`atlas-timeline${timelineActive ? ' is-active' : ''}`}>
                <span>{timelineStartYear}</span>
                <input
                  ref={timelineInputRef}
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={timelineProgress}
                  aria-label="Временная шкала постов"
                  aria-valuetext={timelineActive ? formatMonth(effectivePlayhead) : 'Вся история'}
                  onChange={event => seekTimeline(Number(event.target.value))}
                />
                <strong className="atlas-playback-date">{timelineActive ? formatMonth(effectivePlayhead) : 'Вся история'}</strong>
                <span>{timelineEndYear}</span>
              </div>

              {timelineActive && leadingTopic ? (
                <section
                  className="atlas-playback-insights"
                  aria-label="Выводы за последние шесть месяцев"
                  data-window-months={PLAYBACK_WINDOW_MONTHS}
                  data-leading-topic={leadingTopic.label}
                  data-career-companies={careerCompanies}
                >
                  <article
                    className="atlas-insight-card atlas-career-context"
                    data-insight="career"
                    data-career-companies={careerCompanies}
                  >
                    <small>Работа</small>
                    <strong>
                      <span className="atlas-insight-value">{careerCompanies || 'Между ролями'}</span>
                      {activeCareer.length > 0 && <span className="atlas-insight-context">· {activeCareer.map(item => item.role).join(' + ')}</span>}
                    </strong>
                  </article>
                  <article className="atlas-insight-card" data-insight="leading">
                    <small>Тема</small>
                    <strong>
                      <i style={{ '--topic-color': leadingTopic.color } as React.CSSProperties} />
                      <span className="atlas-insight-value">{leadingTopic.label}</span>
                      <em>{Math.round(leadingTopic.share)}%</em>
                    </strong>
                  </article>
                </section>
              ) : !timelineActive ? (
                <details className="atlas-filter-panel">
                  <summary>
                    <span>Темы</span>
                    <small>{topic === 'all' ? 'Все темы' : topicsById.get(topic)?.label || 'Все темы'}</small>
                  </summary>
                  <div className="atlas-filter-row atlas-topic-filters" aria-label="Фильтр по темам">
                    <button type="button" className={topic === 'all' ? 'is-active' : ''} onClick={() => setTopic('all')}>Все темы</button>
                    {topicPopularity.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        className={topic === item.id ? 'is-active' : ''}
                        onClick={() => setTopic(current => current === item.id ? 'all' : item.id)}
                        data-topic-count={item.count}
                        data-topic-share={item.share.toFixed(2)}
                        data-topic-weight={Math.round(item.weight)}
                        style={{
                          '--topic-color': item.color,
                          '--topic-weight': `${item.weight}%`,
                        } as React.CSSProperties}
                      >
                        <span className="atlas-topic-dot" />
                        <span className="atlas-topic-name">{item.label}</span>
                        <small className="atlas-topic-share">{Math.round(item.share)}%</small>
                      </button>
                    ))}
                  </div>
                </details>
              ) : null}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
