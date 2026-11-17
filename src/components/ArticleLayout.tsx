import { useEffect, useRef, type ReactNode } from 'react'
import { ArticleEnding } from './ArticleEnding'
import { BackButton } from './BackButton'
import { Footer } from './Footer'
import { enhanceCodeBlocks } from '../codeBlocks'
import { imageDimensionsForUrl } from '../imageMetadata'
import { absoluteUrl } from '../site'
import { buildArticleStructuredData, faqItemsFromHtml, htmlToPlainText } from '../structuredData'
import { useArticleSectionLinks } from '../useArticleSectionLinks'
import { useDocumentMeta } from '../useDocumentMeta'

interface ArticleLayoutProps {
  title: string
  description: string
  seoTitle?: string
  seoDescription?: string
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
  seoTitle,
  seoDescription,
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
  const articleRef = useRef<HTMLElement>(null)

  const canonicalUrl = absoluteUrl(canonical)
  const structuredImage = schemaImage || heroImage
  const heroDimensions = imageDimensionsForUrl(heroImage)
  const articleText = bodyText || (bodyHtml ? htmlToPlainText(bodyHtml) : '')
  const faqItems = bodyHtml ? faqItemsFromHtml(bodyHtml) : []
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
    faqItems,
  })

  useDocumentMeta({
    title: seoTitle || `${title} — ${lang === 'en' ? 'Daniil Okhlopkov' : 'Даниил Охлопков'}`,
    description: seoDescription || description,
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

  useArticleSectionLinks(articleRef, canonical, lang, bodyHtml)

  return (
    <div className="page">
      <article ref={bodyHtml ? articleRef : undefined} id="article-content" className="blog-article generated-blog-post article-engine" data-article-engine="article">
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
        {bodyHtml && <ArticleEnding path={canonical} />}
      </article>

      <Footer />
    </div>
  )
}
