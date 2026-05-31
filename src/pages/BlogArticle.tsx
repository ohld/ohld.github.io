import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { ArrowRightUpIcon } from '../components/Icons'
import { articlePath, getBlogArticle } from '../blog'
import { getGeneratedArticlePost } from '../generatedBlogPosts'
import { markdownToHtml } from '../markdown'
import { markdownToPlainText } from '../structuredData'

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

export function BlogArticle() {
  const { slug } = useParams()
  const location = useLocation()
  const generatedArticle = getGeneratedArticlePost(slug)
  const article = getBlogArticle(slug)

  if (generatedArticle) {
    const canonical = articlePath(generatedArticle.slug, generatedArticle.lang)
    const currentPath = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`
    if (currentPath !== canonical) return <Navigate to={canonical} replace />

    return (
      <ArticleLayout
        title={generatedArticle.title}
        description={generatedArticle.description}
        canonical={canonical}
        lang={generatedArticle.lang}
        date={generatedArticle.updatedAt}
        publishedAt={generatedArticle.publishedAt}
        updatedAt={generatedArticle.updatedAt}
        readingTime={generatedArticle.readingTime}
        backTo={generatedArticle.lang === 'en' ? '/en/articles/' : '/ru/articles/'}
        heroImage={generatedArticle.coverImage}
        heroAlt={generatedArticle.coverAlt}
        tags={generatedArticle.tags}
        section={generatedArticle.lang === 'en' ? 'Articles' : 'Статьи'}
        bodyText={markdownToPlainText(generatedArticle.body)}
        bodyHtml={markdownToHtml(generatedArticle.body)}
        alternates={{
          [generatedArticle.lang]: canonical,
          'x-default': canonical,
        }}
      />
    )
  }

  if (!article) return <Navigate to="/ru/articles/" replace />
  const youtubeThumbnail = article.youtube?.thumbnail

  return (
    <ArticleLayout
      title={article.title}
      description={article.description}
      canonical={articlePath(article.slug)}
      date={article.updatedAt}
      publishedAt={article.publishedAt}
      updatedAt={article.updatedAt}
      readingTime={article.readingTime}
      backTo="/ru/articles/"
      heroImage={article.coverImage}
      heroAlt={article.coverAlt}
      schemaImage={article.coverImage || youtubeThumbnail}
      tags={article.tags}
      section="Статьи"
      alternates={{
        ru: articlePath(article.slug),
        'x-default': articlePath(article.slug),
      }}
    >
        {article.youtube && (
          <a
            className="youtube-source-card"
            href={article.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={youtubeThumbnail} alt={article.youtube.title} fetchPriority="high" />
            <div>
              <strong>{article.youtube.title}</strong>
              <span>Открыть на YouTube <ArrowRightUpIcon size={14} /></span>
            </div>
          </a>
        )}

        <section className="article-callout article-callout-take" aria-label="Ключевые выводы">
          <ul>
            <li>Дизайнеру уже мало просто рисовать в Figma: ценность сдвигается к prototype-first и code-aware работе.</li>
            <li><Link to="/topics/ai-agents/">AI-агентам</Link> нужны нормальные design skills: tokens, states, references, constraints и критерии вкуса.</li>
            <li>Главный враг — AI-slop: generic карточки, случайные gradients, непонятная иерархия и отсутствие живого feedback.</li>
          </ul>
        </section>

        <section>
          <h2>Что реально поменялось</h2>
          <p>
            AI меняет скорость макетов и требования к роли дизайнера. Ценнее становится человек,
            который умеет соединять вкус, продуктовую задачу и код. <Link to="/topics/design-engineering/">Design engineer</Link> здесь — роль на стыке: быстро собрать прототип, понять
            ограничения интерфейса, дать агенту нормальные skills и довести
            идею ближе к работающему продукту.
          </p>
          <blockquote>
            <p>Команда «сделай красиво» почти всегда проигрывает нормальным skills, дизайн-токенам и правилам визуального стиля.</p>
            <cite>Вывод из стрима про design engineering</cite>
          </blockquote>
        </section>

        <section>
          <h2>Почему агенты делают AI-slop</h2>
          <p>
            <Link to="/topics/codex/">Codex</Link>, <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">Claude Code</a>, Lovable, v0 и похожие инструменты умеют быстро
            собрать интерфейс. Проблема в том, что без ограничений они тянут
            усреднённый интернет: одинаковые карточки, случайную типографику,
            декоративные блоки и визуальный шум. Контент может быть полезным, но
            интерфейс сразу считывается как сгенерированный.
          </p>
          <div className="article-callout">
            <strong>Практический вывод:</strong> агенту нужен язык дизайна вместе
            с задачей: семантические токены, состояния компонентов, анти-референсы,
            примеры хороших flow и критерии, по которым результат считается готовым.
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
                  <td><a href="https://paper.design/" target="_blank" rel="noopener noreferrer">Paper</a></td>
                  <td>Design-to-code и импорт живых сайтов ближе к HTML/CSS модели.</td>
                  <td>Нужны продуктовая логика и responsive states.</td>
                </tr>
                <tr>
                  <td><a href="https://mobbin.com/mcp" target="_blank" rel="noopener noreferrer">Mobbin MCP</a></td>
                  <td>Реальные UX-референсы для onboarding, paywall, checkout, settings.</td>
                  <td>Можно скопировать паттерн без понимания контекста.</td>
                </tr>
                <tr>
                  <td><Link to="/ru/blog/claude-code-vs-codex-perehod/">Codex / Claude Code</Link></td>
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
            Магии тут нет: это заготовка, которая заставляет агента думать про
            пользователя, states, tokens и проверку результата.
            Для более жесткого вкусового слоя можно взять <a href="https://github.com/emilkowalski/skill" target="_blank" rel="noopener noreferrer">Agents with Taste skill</a> и адаптировать его под проект.
          </p>
          <pre><code data-language="prompt">{designAgentPrompt}</code></pre>
        </section>

        <section>
          <h2>Что делать дальше</h2>
          <ol>
            <li>Собрать <code>design.md</code> для проекта: tokens, typography, spacing, radius, components, anti-patterns.</li>
            <li>Для каждого нового UI task давать агенту задачу, референсы и правила визуального стиля.</li>
            <li>Проверять mobile/desktop, empty/loading/error states и микроинтеракции до финала, особенно если в проекте уже есть <Link to="/articles/markdown-vs-html/">дизайн-система</Link> или хотя бы живой HTML-прототип.</li>
            <li>Сохранять созвоны, решения и дизайн-обсуждения как будущую <a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">память для агентов</a>.</li>
          </ol>
        </section>

        <section>
          <h2>Источники</h2>
          <ul>
            <li><a href="https://www.youtube.com/watch?v=fIEMOzz0_AI" target="_blank" rel="noopener noreferrer">YouTube-запись стрима</a></li>
            <li><a href="https://paper.design/" target="_blank" rel="noopener noreferrer">Paper</a> и <a href="https://paper.design/docs/mcp" target="_blank" rel="noopener noreferrer">Paper MCP</a></li>
            <li><a href="https://mobbin.com/mcp" target="_blank" rel="noopener noreferrer">Mobbin MCP</a></li>
            <li><a href="https://github.com/emilkowalski/skill" target="_blank" rel="noopener noreferrer">Agents with Taste skill</a></li>
          </ul>
        </section>

        <section className="related-links">
          <h2>Читать ещё</h2>
          <Link to="/ru/articles/">Все статьи</Link>
          <Link to="/ru/blog/">Блог</Link>
          <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">Мой сетап Claude Code 2026</a>
          <a href="/luchshie-skills-mcp-claude-code-agent-browser/">Лучшие skills и MCP для Claude Code</a>
        </section>
    </ArticleLayout>
  )
}
