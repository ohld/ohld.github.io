import { ArrowRightIcon } from './Icons'
import { TopicTags } from './TopicTags'
import type { BlogListItem } from '../blog'

export function BlogCard({
  article,
  ctaLabel,
  tagsLabel,
}: {
  article: BlogListItem
  ctaLabel: string
  tagsLabel?: string
}) {
  return (
    <article className={`blog-card ${article.thumbnail ? 'blog-card-with-thumb' : 'blog-card-no-thumb'}`}>
      <a className="blog-card-hitarea" href={article.path} aria-label={article.title} />
      {article.thumbnail && (
        <div className="blog-card-media" aria-hidden="true">
          <img className="blog-card-thumb" src={article.thumbnail} alt="" loading="lazy" />
        </div>
      )}
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
