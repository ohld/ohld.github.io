import { TopicTags } from './TopicTags'
import type { BlogListItem } from '../blog'
import { SITE_THUMBNAIL } from '../site'

export function ArticlePreviewCard({
  article,
  imageLoading = 'lazy',
  tagsLabel,
}: {
  article: BlogListItem
  imageLoading?: 'eager' | 'lazy'
  tagsLabel?: string
}) {
  const thumbnail = article.thumbnail || SITE_THUMBNAIL

  return (
    <article className="article-preview-card">
      <a className="article-preview-hitarea" href={article.path} aria-label={article.title} />
      <div className="article-preview-media">
        <img
          className="article-preview-thumb"
          src={thumbnail}
          alt={article.title}
          loading={imageLoading}
          fetchPriority={imageLoading === 'eager' ? 'high' : undefined}
          decoding="async"
        />
      </div>
      <div className="article-preview-body">
        <div className="content-card-meta">
          <span>{article.publishedAt}</span>
          <span>{article.readingTime}</span>
        </div>
        <h2>{article.title}</h2>
        <p>{article.description}</p>
        <TopicTags tags={article.tags} label={tagsLabel} />
      </div>
    </article>
  )
}
