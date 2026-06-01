import { useLocation } from 'react-router-dom'
import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { absoluteUrl, SITE_DESCRIPTION } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { russianArticleItems, russianBlogItems } from '../blog'

const latestBlogItems = russianBlogItems.slice(0, 3)
const latestArticleItems = russianArticleItems.slice(0, 3)

export function Home() {
  const location = useLocation()
  const canonicalPath = location.pathname.startsWith('/ru') ? '/ru/' : '/'
  useDocumentMeta({
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: SITE_DESCRIPTION,
    canonical: absoluteUrl(canonicalPath),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/ru/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Даниил Охлопков</h1>
        <p className="page-header-bio">
          AI-native аналитика, on-chain данные, Telegram и агентские workflow.
          Здесь свежие тексты про инструменты, эксперименты и рабочие схемы,
          которые я сам проверяю. Бэкграунд, опыт и ссылки — на странице
          <a href="/about/"> обо мне</a>.
        </p>
      </header>

      <main className="home-latest" aria-label="Свежие материалы">
        <section className="home-section home-latest-section" aria-labelledby="home-blog">
          <div className="home-section-heading">
            <div>
              <h2 id="home-blog">Блог</h2>
              <p>Свежие рабочие заметки: что пробую, что ломается, что оставляю в сетапе.</p>
            </div>
            <a className="home-section-link" href="/ru/blog/">Все записи</a>
          </div>
          <div className="blog-preview-grid">
            {latestBlogItems.map((article) => (
              <ArticlePreviewCard article={article} imageLoading="eager" key={article.path} />
            ))}
          </div>
        </section>

        <section className="home-section home-latest-section" aria-labelledby="home-articles">
          <div className="home-section-heading">
            <div>
              <h2 id="home-articles">Статьи</h2>
              <p>Более плотные разборы: источники, таблицы, сравнения, промпты и выводы.</p>
            </div>
            <a className="home-section-link" href="/ru/articles/">Все статьи</a>
          </div>
          <div className="blog-preview-grid">
            {latestArticleItems.map((article) => (
              <ArticlePreviewCard article={article} imageLoading="eager" key={article.path} />
            ))}
          </div>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-guide">
          <h2 id="home-guide">Что здесь читать</h2>
          <p>
            Главная — это карта свежих материалов, а не ещё одна версия резюме.
            Я оставляю здесь тексты, которые помогают быстро понять, какие
            инструменты и подходы сейчас проходят проверку практикой: AI-агенты,
            рабочие процессы вокруг Codex и Claude Code, on-chain аналитика,
            Telegram-автоматизация и личные системы для памяти проекта.
          </p>
          <p>
            Короткие наблюдения, дневники сетапа и заметки из текущей работы
            попадают в блог. Более плотные разборы, где нужны источники,
            сравнения, таблицы, промпты и выводы, лежат в статьях. Бэкграунд,
            опыт, контакты и социальные ссылки вынесены на страницу обо мне,
            чтобы главная не превращалась в длинный профиль.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-topics">
          <h2 id="home-topics">Основные темы</h2>
          <ul className="home-detail-list">
            <li>
              <a href="/topics/ai-agents/">AI-агенты</a> — практические
              сценарии, где агент не просто отвечает в чате, а читает контекст,
              работает с файлами, проверяет себя и доводит задачу до результата.
            </li>
            <li>
              <a href="/topics/claude-code/">Claude Code</a> и
              <a href="/topics/codex/"> Codex</a> — настройки, skills, MCP,
              hooks, browser smoke, ревью diff и длинные задачи, которые нужно
              держать в управляемом цикле.
            </li>
            <li>
              <a href="/topics/ton-data/">TON-данные</a> — on-chain аналитика,
              Dune, исследовательские запросы, метрики и способы превратить
              сырые данные в решение для продукта или команды.
            </li>
            <li>
              <a href="/topics/telegram-automation/">Telegram-автоматизация</a>
              — mini apps, боты, контентные пайплайны, каналы и рабочие
              интерфейсы, где Telegram становится частью операционной системы.
            </li>
            <li>
              <a href="/topics/second-brain/">Second brain</a> — Obsidian,
              GBrain, проектная память, raw notes и правила, которые помогают
              не терять решения после длинных agent-сессий.
            </li>
          </ul>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-route">
          <h2 id="home-route">Как пользоваться сайтом</h2>
          <p>
            Если вы пришли из поиска на конкретную статью, лучше продолжать на
            языке этой страницы: русские материалы живут в разделе
            <a href="/ru/blog/"> Блог</a> и <a href="/ru/articles/">Статьи</a>,
            английские — в <a href="/en/blog/">Blog</a> и
            <a href="/en/articles/"> Articles</a>. Переключатель RU/EN в шапке
            не прячет страницы за автопереездом, поэтому поисковики и люди
            видят стабильные адреса.
          </p>
          <p>
            Я стараюсь писать не обзор ради обзора, а рабочие заметки после
            реального теста: что ускорило задачу, где инструмент сломался, какие
            настройки стоит повторить и какие выводы лучше сохранить в проектной
            памяти. Поэтому главная показывает последние материалы с картинками,
            а полный архив остаётся в разделах.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-language">
          <h2 id="home-language">Язык и маршрутизация</h2>
          <p>
            Для многоязычного сайта важнее не угадать язык любой ценой, а
            сохранить понятные адреса. Поэтому русская версия живёт на
            <a href="/ru/"> /ru/</a>, английская — на <a href="/en/">/en/</a>,
            а отдельные статьи могут иметь свои стабильные URL и
            hreflang-связки. Если человек пришёл из Google на русскую статью,
            сайт не должен внезапно отправлять его на английскую главную только
            из-за настроек браузера.
          </p>
          <p>
            Такой подход лучше подходит для личного блога и лендинга: поисковик
            индексирует каждую языковую страницу отдельно, пользователь может
            явно переключить язык в шапке, а главный домен остаётся аккуратной
            точкой входа. Дальше можно запоминать выбранный язык для интерфейса,
            но публичные URL и canonical-адреса должны оставаться стабильными.
          </p>
          <p>
            Практический компромисс простой: язык можно подсказывать интерфейсом,
            но не стоит ломать путь, по которому человек уже пришёл. Если
            материал найден по русскому запросу, русская страница должна
            открываться как самостоятельный результат; если по английскому —
            английская должна иметь такую же самостоятельную жизнь.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
