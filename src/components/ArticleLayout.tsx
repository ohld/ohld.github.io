import { useEffect, type ReactNode } from 'react'
import { BackButton } from './BackButton'
import { Footer } from './Footer'
import { enhanceCodeBlocks } from '../codeBlocks'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

interface ArticleLayoutProps {
  title: string
  description: string
  canonical: string
  lang?: string
  date: string
  readingTime: string
  backTo?: string
  heroImage?: string
  heroAlt?: string
  alternates?: Record<string, string>
  bodyHtml?: string
  children?: ReactNode
}

export function ArticleLayout({
  title,
  description,
  canonical,
  lang = 'ru',
  date,
  readingTime,
  backTo,
  heroImage,
  heroAlt,
  alternates,
  bodyHtml,
  children,
}: ArticleLayoutProps) {
  useDocumentMeta({
    title: `${title} — Даниил Охлопков`,
    description,
    canonical: absoluteUrl(canonical),
    lang,
    image: heroImage ? absoluteUrl(heroImage) : undefined,
    alternates: alternates
      ? Object.fromEntries(Object.entries(alternates).map(([key, href]) => [key, absoluteUrl(href)]))
      : undefined,
  })

  useEffect(() => {
    enhanceCodeBlocks(document)
  }, [canonical, bodyHtml])

  return (
    <div className="page">
      <article className="blog-article generated-blog-post article-engine" data-article-engine="article">
        <div className="subpage-header">
          <BackButton to={backTo} />
          <div className="blog-article-meta">
            <span>{date}</span>
            <span className="content-card-dot" />
            <span>{readingTime}</span>
          </div>
          <h1 className="subpage-title">{title}</h1>
          {description && <p className="subpage-subtitle">{description}</p>}
        </div>

        {heroImage && (
          <figure className="article-hero-image">
            <img src={heroImage} alt={heroAlt || title} fetchPriority="high" />
          </figure>
        )}

        {bodyHtml ? (
          <div
            className="generated-blog-body article-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : children}
      </article>

      <Footer />
    </div>
  )
}
