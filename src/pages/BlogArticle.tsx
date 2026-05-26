import { Link, Navigate, useParams } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { ArrowRightUpIcon } from '../components/Icons'
import { articlePath, getBlogArticle } from '../blog'

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
  const article = getBlogArticle(slug)

  if (!article) return <Navigate to="/articles/" replace />

  return (
    <ArticleLayout
      title={article.title}
      description={article.description}
      canonical={articlePath(article.slug)}
      date={article.updatedAt}
      readingTime={article.readingTime}
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
            <img src={article.youtube.thumbnail} alt="" fetchPriority="high" />
            <div>
              <strong>{article.youtube.title}</strong>
              <span>Открыть на YouTube <ArrowRightUpIcon size={14} /></span>
            </div>
          </a>
        )}

        <section className="article-callout article-callout-take" aria-label="Ключевые выводы">
          <ul>
            <li>Дизайнеру уже мало просто рисовать в Figma: ценность сдвигается к prototype-first и code-aware работе.</li>
            <li>AI-агентам нужны нормальные design skills: tokens, states, references, constraints и критерии вкуса.</li>
            <li>Главный враг — AI-slop: generic карточки, случайные gradients, непонятная иерархия и отсутствие живого feedback.</li>
          </ul>
        </section>

        <section>
          <h2>Что реально поменялось</h2>
          <p>
            AI меняет скорость макетов и требования к роли дизайнера. Ценнее становится человек,
            который умеет соединять вкус, продуктовую задачу и код. Design
            engineer здесь — роль на стыке: быстро собрать прототип, понять
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
            Codex, Claude Code, Lovable, v0 и похожие инструменты умеют быстро
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
                  <td>Paper</td>
                  <td>Design-to-code и импорт живых сайтов ближе к HTML/CSS модели.</td>
                  <td>Нужны продуктовая логика и responsive states.</td>
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
            Магии тут нет: это заготовка, которая заставляет агента думать про
            пользователя, states, tokens и проверку результата.
          </p>
          <pre><code data-language="prompt">{designAgentPrompt}</code></pre>
        </section>

        <section>
          <h2>Что делать дальше</h2>
          <ol>
            <li>Собрать <code>design.md</code> для проекта: tokens, typography, spacing, radius, components, anti-patterns.</li>
            <li>Для каждого нового UI task давать агенту задачу, референсы и правила визуального стиля.</li>
            <li>Проверять mobile/desktop, empty/loading/error states и микроинтеракции до финала.</li>
            <li>Сохранять созвоны, решения и дизайн-обсуждения как будущую память для агентов.</li>
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
          <Link to="/articles/">Все статьи</Link>
          <Link to="/blog/">Блог</Link>
          <a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">Мой сетап Claude Code 2026</a>
          <a href="/luchshie-skills-mcp-claude-code-agent-browser/">Лучшие skills и MCP для Claude Code</a>
        </section>
    </ArticleLayout>
  )
}
