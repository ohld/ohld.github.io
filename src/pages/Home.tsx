import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { absoluteUrl, SITE_DESCRIPTION } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { latestUniqueItems, russianArticleItems, russianBlogItems } from '../blog'

const latestWritingItems = latestUniqueItems([...russianBlogItems, ...russianArticleItems], 6)

export function Home() {
  useDocumentMeta({
    title: 'Даниил Охлопков — AI-агенты, данные, TON и Telegram',
    description: SITE_DESCRIPTION,
    canonical: absoluteUrl('/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/'),
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
        <section className="home-section home-latest-section" aria-labelledby="home-latest">
          <div className="home-section-heading">
            <div>
              <h2 id="home-latest">Свежие материалы</h2>
            </div>
            <div className="home-section-actions">
              <a className="home-section-link" href="/ru/blog/">Блог</a>
              <a className="home-section-link" href="/ru/articles/">Статьи</a>
            </div>
          </div>
          <div className="blog-preview-grid">
            {latestWritingItems.map((article, index) => (
              <ArticlePreviewCard article={article} imageLoading={index === 0 ? 'eager' : 'lazy'} key={article.path} />
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
            В блог попадают тексты, которые выросли из моих Telegram-постов:
            исходная мысль остаётся узнаваемой, а вокруг неё добавляются
            контекст, ссылки, примеры и заметки из других источников. В статьи
            уходят отдельные поисковые темы, где нужен плотный гайд, сравнение,
            таблицы, промпты и выводы. Оба формата нужны: короткие посты дают
            контекст, длинные статьи помогают разобраться глубже.
          </p>
          <p>
            Часть заметок короткая и полезна как быстрый ориентир перед
            решением похожей задачи. Часть материалов длиннее: там я разбираю
            контекст, ограничения, альтернативы и практический результат.
            Общая идея простая: сайт должен быть не витриной, а рабочим архивом
            проверенных находок, к которым можно вернуться через неделю или
            отправить ссылку человеку с похожим вопросом. Всё это пишется для
            практики, а не отчётности.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-topics">
          <h2 id="home-topics">Основные темы</h2>
          <p>
            Если вы впервые на сайте, начните с материалов про мой AI-сетап,
            практику работы с агентами и разборы инструментов, которые уже
            прошли через реальные задачи. Я стараюсь оставлять не абстрактные
            впечатления, а конкретику: что ускорило работу, где пришлось
            менять процесс, какие настройки можно повторить и какие выводы
            лучше сохранить для следующего проекта.
          </p>
          <p>
            Дальше удобно идти по темам: AI-агенты для рабочих задач, AI tools
            для выбора рабочего стека, Codex и Claude Code для разработки,
            web scraping для добычи данных, TON-данные для исследований,
            Telegram-автоматизация для продуктов и каналов, second brain для
            личной памяти. Хороший материал здесь должен помогать сделать
            следующий шаг: проверить гипотезу, собрать прототип, настроить
            workflow или не повторить уже найденную ошибку.
          </p>
          <ul className="home-detail-list">
            <li>
              <a href="/topics/ai-agents/">AI-агенты</a> — практические
              сценарии, где агент не просто отвечает в чате, а читает контекст,
              работает с файлами, проверяет себя и доводит задачу до результата.
            </li>
            <li>
              <a href="/topics/ai-tools/">AI-инструменты</a> — Claude Code,
              Codex, OpenClaw, Hermes, GBrain, GStack и другие инструменты,
              которые стоит сравнивать по реальным задачам, а не по хайпу.
            </li>
            <li>
              <a href="/topics/claude-code/">Claude Code</a> и
              <a href="/topics/codex/"> Codex</a> — настройки, skills, MCP,
              hooks, browser smoke, ревью diff и длинные задачи, которые нужно
              держать в управляемом цикле.
            </li>
            <li>
              <a href="/topics/web-scraping/">Web scraping</a> — API/XHR,
              Playwright, browser agents, HTML parsing и практические границы
              между one-off extraction и продакшен-парсером.
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
      </main>

      <Footer />
    </div>
  )
}
