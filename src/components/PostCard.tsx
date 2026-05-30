import { openUrl } from '../openUrl'

interface PostCardProps {
  title: string
  date: string
  views: number
  fwd: number
  link: string
  tags?: string[]
  subtitle?: string
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toString()
}

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

export function PostCard({ title, date, views, fwd, link, tags, subtitle }: PostCardProps) {
  const displayTags = (tags || [])
    .filter((t) => t !== 'misc')
    .map((t) => TAG_LABELS[t] || t)

  return (
    <div className="post-item" onClick={() => openUrl(link, 'post', title)} role="link">
      <div className="post-item-meta">
        <span>{date}</span>
        <span>👁 {formatNumber(views)}</span>
        <span>↗ {fwd}</span>
        {displayTags.slice(0, 2).map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </div>
      <p className="post-item-title">{title}</p>
      {subtitle && <p className="post-item-subtitle">{subtitle}</p>}
    </div>
  )
}
