import { useEffect, type ReactNode } from 'react'
import { BackButton } from './BackButton'
import { Footer } from './Footer'
import { enhanceCodeBlocks } from '../codeBlocks'
import { imageDimensionsForUrl } from '../imageMetadata'
import { absoluteUrl } from '../site'
import { buildArticleStructuredData, htmlToPlainText } from '../structuredData'
import { useDocumentMeta } from '../useDocumentMeta'

interface ArticleLayoutProps {
  title: string
  description: string
  canonical: string
  lang?: string
  date: string
  publishedAt?: string
  updatedAt?: string
  readingTime: string
  backTo?: string
  heroImage?: string
  heroAlt?: string
  schemaImage?: string
  alternates?: Record<string, string>
  bodyHtml?: string
  bodyText?: string
  tags?: string[]
  section?: string
  children?: ReactNode
}

export function ArticleLayout({
  title,
  description,
  canonical,
  lang = 'ru',
  date,
  publishedAt,
  updatedAt,
  readingTime,
  backTo,
  heroImage,
  heroAlt,
  schemaImage,
  alternates,
  bodyHtml,
  bodyText,
  tags = [],
  section = lang === 'en' ? 'Blog' : 'Блог',
  children,
}: ArticleLayoutProps) {
  const canonicalUrl = absoluteUrl(canonical)
  const structuredImage = schemaImage || heroImage
  const heroDimensions = imageDimensionsForUrl(heroImage)
  const articleText = bodyText || (bodyHtml ? htmlToPlainText(bodyHtml) : '')
  const jsonLd = buildArticleStructuredData({
    title,
    description,
    canonical: canonicalUrl,
    lang,
    publishedAt: publishedAt || date,
    updatedAt: updatedAt || date,
    image: structuredImage ? absoluteUrl(structuredImage) : undefined,
    tags,
    section,
    bodyText: articleText,
  })

  useDocumentMeta({
    title: `${title} — ${lang === 'en' ? 'Daniil Okhlopkov' : 'Даниил Охлопков'}`,
    description,
    canonical: canonicalUrl,
    lang,
    image: structuredImage ? absoluteUrl(structuredImage) : undefined,
    imageAlt: heroAlt || title,
    type: 'article',
    publishedTime: publishedAt || date,
    modifiedTime: updatedAt || date,
    tags,
    section,
    jsonLd,
    alternates: alternates
      ? Object.fromEntries(Object.entries(alternates).map(([key, href]) => [key, absoluteUrl(href)]))
      : undefined,
  })

  useEffect(() => {
    enhanceCodeBlocks(document)
  }, [canonical, bodyHtml])

  return (
    <div className="page">
      <article id="article-content" className="blog-article generated-blog-post article-engine" data-article-engine="article">
        <div className="subpage-header">
          <BackButton to={backTo} />
          <div className="blog-article-meta">
            <span>{date}</span>
            <span>{readingTime}</span>
          </div>
          <h1 className="subpage-title">{title}</h1>
          {description && <p className="subpage-subtitle">{description}</p>}
        </div>

        {heroImage && (
          <figure className="article-hero-image">
            <img
              src={heroImage}
              alt={heroAlt || title}
              width={heroDimensions?.width}
              height={heroDimensions?.height}
              decoding="async"
              fetchPriority="high"
            />
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
