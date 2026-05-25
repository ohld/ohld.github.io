import { Link } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { russianArticleItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function ArticlesIndex() {
  useDocumentMeta({
    title: 'Статьи — Даниил Охлопков',
    description: 'Туториалы, сравнения AI-инструментов и плотные разборы Даниила Охлопкова: OpenClaw, Claude Code, Codex, Cursor, MCP и agent workflows.',
    canonical: absoluteUrl('/articles/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/articles/'),
      en: absoluteUrl('/en/articles/'),
      'x-default': absoluteUrl('/articles/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Статьи</h1>
        <p className="subpage-subtitle">
          Туториалы, сравнения и практические разборы. Это не просто переписанные посты, а страницы с источниками, таблицами, промптами, видео и обновлениями.
        </p>
      </div>

      <main className="blog-list" aria-label="Статьи">
        {russianArticleItems.map((article) => (
          <Link className={`blog-card ${article.thumbnail ? 'blog-card-with-thumb' : 'blog-card-no-thumb'}`} to={article.path} key={article.path}>
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
              <div className="blog-card-tags" aria-label="Теги">
                {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <span className="blog-card-link">Читать <ArrowRightIcon size={16} /></span>
            </div>
          </Link>
        ))}
      </main>

      <Footer />
    </div>
  )
}
