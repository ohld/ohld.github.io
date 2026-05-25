import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { englishArticleItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function EnglishArticlesIndex() {
  useDocumentMeta({
    title: 'Articles — Daniil Okhlopkov',
    description: 'English tutorials and preserved explainers by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP and automation.',
    canonical: absoluteUrl('/en/articles/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/articles/'),
      en: absoluteUrl('/en/articles/'),
      'x-default': absoluteUrl('/articles/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton to="/en/" />
        <h1 className="subpage-title">Articles</h1>
        <p className="subpage-subtitle">
          English tutorials and preserved evergreen explainers. New Russian-first experiments get translated when there is real demand.
        </p>
      </div>

      <main className="blog-list" aria-label="English articles">
        {englishArticleItems.map((article) => (
          <a className={`blog-card ${article.thumbnail ? 'blog-card-with-thumb' : 'blog-card-no-thumb'}`} href={article.path} key={article.path}>
            {article.thumbnail && (
              <img className="blog-card-thumb" src={article.thumbnail} alt="" loading="lazy" />
            )}
            <div className="blog-card-body">
              <div className="content-card-meta">
                <span>{article.publishedAt}</span>
                <span className="content-card-dot" />
                <span>{article.readingTime}</span>
              </div>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <div className="blog-card-tags" aria-label="Tags">
                {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <span className="blog-card-link">Read <ArrowRightIcon size={16} /></span>
            </div>
          </a>
        ))}
      </main>

      <Footer />
    </div>
  )
}
