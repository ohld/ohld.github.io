import { ArrowRightIcon } from './Icons'
import { TopicTags } from './TopicTags'
import type { BlogListItem } from '../blog'
import { SITE_THUMBNAIL } from '../site'

export function BlogCard({
  article,
  ctaLabel,
  tagsLabel,
  mediaLayout = 'side',
}: {
  article: BlogListItem
  ctaLabel: string
  tagsLabel?: string
  mediaLayout?: 'side' | 'top'
}) {
  const thumbnail = article.thumbnail || SITE_THUMBNAIL
  const cardClassName = [
    'blog-card',
    'blog-card-with-thumb',
    mediaLayout === 'top' ? 'blog-card-image-first' : '',
  ].filter(Boolean).join(' ')

  return (
    <article className={cardClassName}>
      <a className="blog-card-hitarea" href={article.path} aria-label={article.title} />
      <div className="blog-card-media">
        <img className="blog-card-thumb" src={thumbnail} alt={article.title} loading="lazy" />
      </div>
      <div className="blog-card-body">
        <div className="content-card-meta">
          <span>{article.publishedAt}</span>
          <span className="content-card-dot" />
          <span>{article.readingTime}</span>
        </div>
        <h2>{article.title}</h2>
        <p>{article.description}</p>
        <TopicTags tags={article.tags} label={tagsLabel} />
        <span className="blog-card-link">{ctaLabel} <ArrowRightIcon size={16} /></span>
      </div>
    </article>
  )
}
