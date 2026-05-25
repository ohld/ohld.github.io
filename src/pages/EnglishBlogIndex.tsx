import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { englishBlogItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function EnglishBlogIndex() {
  useDocumentMeta({
    title: 'Blog — Daniil Okhlopkov',
    description: 'English blog posts and preserved notes by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP, data and Telegram workflows.',
    canonical: absoluteUrl('/en/blog/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/blog/'),
      en: absoluteUrl('/en/blog/'),
      'x-default': absoluteUrl('/blog/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton to="/en/" />
        <h1 className="subpage-title">Blog</h1>
        <p className="subpage-subtitle">
          English-only blog posts and preserved notes. Russian-first originals live in the RU blog.
        </p>
      </div>

      <main className="blog-list" aria-label="English blog articles">
        {englishBlogItems.map((article) => (
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
