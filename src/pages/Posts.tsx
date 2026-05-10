import { useState, useMemo, useEffect } from 'react'
import { BackButton } from '../components/BackButton'
import { PostCard } from '../components/PostCard'
import { Footer } from '../components/Footer'
import { useDocumentMeta } from '../useDocumentMeta'

interface Post {
  id: number
  title: string
  date: string
  views: number
  fwd: number
  replies: number
  tags?: string[]
  link: string
}

const TOPIC_TAGS = ['ai', 'crypto', 'ton', 'tg_apps', 'startups', 'data', 'social', 'personal']

const TAG_LABELS: Record<string, string> = {
  ai: 'AI',
  crypto: 'Crypto',
  ton: 'TON',
  tg_apps: 'TG Apps',
  startups: 'Startups',
  data: 'Data',
  social: 'Social',
  personal: 'Личное',
}

const POSTS_PER_PAGE = 30
const TOP = '__top__'

export function Posts() {
  useDocumentMeta({
    title: 'Топ посты — Даниил Охлопков',
    description: 'Лучшие посты @danokhlopkov: AI-агенты, крипта, TON, стартапы, данные.',
    canonical: 'https://ohld.github.io/posts/',
  })
  const [activeFilter, setActiveFilter] = useState<string>(TOP)
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [allPosts, setAllPosts] = useState<Post[]>([])

  useEffect(() => {
    fetch('/posts.json')
      .then((r) => r.json())
      .then(setAllPosts)
      .catch(() => setAllPosts([]))
  }, [])

  const filtered = useMemo(() => {
    let posts = [...allPosts]

    if (activeFilter === TOP) {
      const now = Date.now()
      const score = (p: Post) => {
        const ageMs = now - new Date(p.date).getTime()
        const ageDays = ageMs / (1000 * 60 * 60 * 24)
        const recency = Math.pow(0.5, ageDays / 180)
        return p.fwd * (0.3 + 0.7 * recency)
      }
      posts.sort((a, b) => score(b) - score(a))
    } else {
      posts = posts.filter((p) => p.tags?.includes(activeFilter))
      posts.sort((a, b) => b.date.localeCompare(a.date))
    }

    return posts
  }, [activeFilter, allPosts])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter)
    setVisibleCount(POSTS_PER_PAGE)
  }

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Посты</h1>
        <p className="subpage-subtitle">{filtered.length} постов</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${activeFilter === TOP ? 'filter-btn-active' : ''}`}
          onClick={() => handleFilterClick(TOP)}
        >
          🔥 Топ
        </button>
        {TOPIC_TAGS.map((t) => (
          <button
            key={t}
            className={`filter-btn ${activeFilter === t ? 'filter-btn-active' : ''}`}
            onClick={() => handleFilterClick(t)}
          >
            {TAG_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <main style={{ flex: 1 }}>
        {visible.map((post: Post) => (
          <PostCard
            key={post.id}
            title={post.title}
            date={post.date}
            views={post.views}
            fwd={post.fwd}
            link={post.link}
            tags={post.tags}
          />
        ))}

        {hasMore && (
          <div className="load-more">
            <button
              className="link-btn"
              onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
            >
              Загрузить ещё ({filtered.length - visibleCount})
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
