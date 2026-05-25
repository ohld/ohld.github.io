import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightUpIcon } from '../components/Icons'
import { articlePath, getBlogArticle } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

const designAgentPrompt = `Ты помогаешь сделать frontend экран не похожим на AI-slop.

Контекст:
- пользователь: [кто открывает экран]
- задача: [что он должен сделать]
- продуктовый риск: [что нельзя сломать]
- референсы: [2-5 ссылок или описаний]

Правила:
1. Используй semantic tokens: text-primary, text-secondary, bg, surface-100, border, accent.
2. Покажи empty/loading/error/success states.
3. Не добавляй декоративные карточки без функции.
4. Добавь micro-interactions только там, где они дают feedback.
5. Перед финалом проверь mobile и desktop viewport.`

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="copy-block">
      <div className="copy-block-header">
        <span>{label}</span>
        <button type="button" onClick={copy}>{copied ? 'Скопировано' : 'Копировать'}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

export function BlogArticle() {
  const { slug } = useParams()
  const article = getBlogArticle(slug)

  if (!article) return <Navigate to="/articles/" replace />

  useDocumentMeta({
    title: `${article.title} — Даниил Охлопков`,
    description: article.description,
    canonical: absoluteUrl(articlePath(article.slug)),
  })

  return (
    <div className="page">
      <article className="blog-article">
        <div className="subpage-header">
          <BackButton />
          <div className="blog-article-meta">
            <span>{article.publishedAt}</span>
            <span className="content-card-dot" />
            <span>Обновлено {article.updatedAt}</span>
            <span className="content-card-dot" />
            <span>{article.readingTime}</span>
          </div>
          <h1 className="subpage-title">{article.title}</h1>
          <p className="subpage-subtitle">{article.description}</p>
        </div>

        {article.youtube && (
          <a
            className="youtube-source-card"
            href={article.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={article.youtube.thumbnail} alt="" fetchPriority="high" />
            <div>
              <span className="youtube-source-label">YouTube source</span>
              <strong>{article.youtube.title}</strong>
              <span>Открыть на YouTube <ArrowRightUpIcon size={14} /></span>
            </div>
          </a>
        )}

        <section className="article-callout article-callout-take">
          <h2>Коротко</h2>
          <ul>
            <li>Дизайнеру уже мало просто рисовать в Figma: ценность сдвигается к prototype-first и code-aware работе.</li>
            <li>AI-агентам нужен не магический промпт, а контекст: tokens, states, references, constraints и критерии вкуса.</li>
            <li>Главный враг — AI-slop: generic карточки, случайные gradients, непонятная иерархия и отсутствие живого feedback.</li>
          </ul>
        </section>

        <section>
          <h2>Что реально поменялось</h2>
          <p>
            Разговор был не про то, что AI «заменит дизайнеров». Скорее наоборот:
            становится ценнее человек, который умеет соединять вкус, продуктовую
            задачу и код. Design engineer — это не фронтендер с красивыми кнопками
            и не дизайнер, который случайно открыл Cursor. Это роль на стыке:
            быстро собрать прототип, понять ограничения интерфейса, дать агенту
            нормальный контекст и довести идею ближе к работающему продукту.
          </p>
          <blockquote>
            <p>Команда «сделай красиво» почти всегда проигрывает хорошему контексту.</p>
            <cite>Вывод из стрима про design engineering</cite>
          </blockquote>
        </section>

        <section>
          <h2>Почему агенты делают AI-slop</h2>
          <p>
            Codex, Claude Code, Lovable, v0 и похожие инструменты умеют быстро
            собрать интерфейс. Проблема в том, что без ограничений они тянут
            усреднённый интернет: одинаковые карточки, случайную типографику,
            декоративные блоки и визуальный шум. Контент может быть полезным, но
            интерфейс сразу считывается как сгенерированный.
          </p>
          <div className="article-callout">
            <strong>Практический вывод:</strong> агенту нужно дать не только задачу,
            но и язык дизайна: семантические токены, состояния компонентов,
            анти-референсы, примеры хороших flow и критерии, по которым результат
            считается готовым.
          </div>
        </section>

        <section>
          <h2>Инструменты и где они полезны</h2>
          <div className="article-table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  <th>Инструмент</th>
                  <th>Для чего</th>
                  <th>Риск</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Paper</td>
                  <td>Design-to-code и импорт живых сайтов ближе к HTML/CSS модели.</td>
                  <td>Не заменяет продуктовую логику и responsive states.</td>
                </tr>
                <tr>
                  <td>Mobbin MCP</td>
                  <td>Реальные UX-референсы для onboarding, paywall, checkout, settings.</td>
                  <td>Можно скопировать паттерн без понимания контекста.</td>
                </tr>
                <tr>
                  <td>Codex / Claude Code</td>
                  <td>Сборка route, ревью, перенос UI в код, работа с существующим проектом.</td>
                  <td>Без дизайн-системы быстро скатываются в generic UI.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Промпт, который можно дать агенту</h2>
          <p>
            Это не универсальная магия. Это заготовка, которая заставляет агента
            думать про пользователя, states, tokens и проверку результата.
          </p>
          <CopyBlock label="prompt" code={designAgentPrompt} />
        </section>

        <section>
          <h2>Что делать дальше</h2>
          <ol>
            <li>Собрать <code>design.md</code> для проекта: tokens, typography, spacing, radius, components, anti-patterns.</li>
            <li>Для каждого нового UI task давать агенту не только задачу, но и референсы.</li>
            <li>Проверять mobile/desktop, empty/loading/error states и микроинтеракции до финала.</li>
            <li>Сохранять созвоны, решения и дизайн-обсуждения как будущую память для агентов.</li>
          </ol>
        </section>

        <section>
          <h2>Source pack</h2>
          <ul>
            <li><a href="https://www.youtube.com/watch?v=fIEMOzz0_AI" target="_blank" rel="noopener noreferrer">YouTube-запись стрима</a></li>
            <li><a href="https://paper.design/" target="_blank" rel="noopener noreferrer">Paper</a> и <a href="https://paper.design/docs/mcp" target="_blank" rel="noopener noreferrer">Paper MCP</a></li>
            <li><a href="https://mobbin.com/mcp" target="_blank" rel="noopener noreferrer">Mobbin MCP</a></li>
            <li><a href="https://github.com/emilkowalski/skill" target="_blank" rel="noopener noreferrer">Agents with Taste skill</a></li>
          </ul>
        </section>

        <section className="related-links">
          <h2>Дальше по теме</h2>
          <Link to="/articles/">Все SEO-статьи</Link>
          <Link to="/blog/">Блог из Telegram-постов</Link>
          <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">Мой сетап Claude Code 2026</a>
          <a href="/luchshie-skills-mcp-claude-code-agent-browser/">Лучшие skills и MCP для Claude Code</a>
        </section>
      </article>

      <Footer />
    </div>
  )
}
