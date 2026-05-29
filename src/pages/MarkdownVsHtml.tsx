import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { buildArticleStructuredData, htmlToPlainText } from '../structuredData'
import { useDocumentMeta } from '../useDocumentMeta'

const COVER_IMAGE = '/assets/articles/markdown-vs-html/html-vs-markdown-cover.webp'
const COVER_ALT = 'Мем-обложка HTML > Markdown: исходная Pinterest-картинка, расширенная до 16:9 для статьи про AI-agent артефакты'

const ARTICLE_HTML = `
<div class="mvh-meta">
  Адаптация статьи Tariq из команды Claude Code · перевод и комментарии Дана Охлопкова<br>
  Оригинал: <a href="https://x.com/trq212/status/2052809885763747935" target="_blank" rel="noopener">x.com/trq212</a> · примеры автора: <a href="https://thariqs.github.io/html-effectiveness" target="_blank" rel="noopener">thariqs.github.io/html-effectiveness</a>
</div>

<figure class="mvh-cover">
  <img src="${COVER_IMAGE}" alt="${COVER_ALT}" width="1280" height="720" fetchpriority="high" decoding="async">
</figure>

<blockquote>
  <p>TL;DR — Markdown был хорош, пока ты сам редактировал файлы. Сейчас файлы пишет агент, ты их читаешь, ревьюишь и шаришь. В этой реальности HTML побеждает по плотности информации, читаемости, шерингу и интерактиву. Цена — токены, время и шумные diff'ы.</p>
</blockquote>

<div class="mvh-answer">
  <strong>Коротко:</strong> Markdown всё ещё норм для коротких заметок, raw-транскриптов и файлов, которые человек будет править руками. Для длинных AI-agent артефактов HTML выигрывает: он даёт визуальную плотность, нормальный шеринг ссылкой/PDF, интерактив и copy-back в Claude Code.
</div>

<div class="mvh-toc">
  <div class="mvh-toc-title">В этой статье</div>
  <ol>
    <li><a href="#kontekst">Что поменялось в работе с агентами</a></li>
    <li><a href="#kogda">Короткий ответ: когда HTML, когда Markdown</a></li>
    <li><a href="#pochemu">Почему HTML — 6 причин</a></li>
    <li><a href="#sravnenie">Сравнение в одной таблице</a></li>
    <li><a href="#markdown">Где Markdown всё ещё лучше</a></li>
    <li><a href="#kejsy">Юзкейсы с примерами промптов</a></li>
    <li><a href="#minusy">Честные минусы</a></li>
    <li><a href="#start">Как начать прямо сейчас</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ol>
</div>

<h2 id="kontekst">Что поменялось</h2>

<p><a href="https://spec.commonmark.org/0.31.2/" target="_blank" rel="noopener">Markdown</a> стал дефолтным языком общения между <a href="/topics/ai-agents/">AI-агентами</a> и людьми. Простой, портативный, немного rich text, легко править руками. Claude даже научился рисовать ASCII-диаграммы внутри markdown'а — местами впечатляюще.</p>

<p>Но чем мощнее становятся агенты, тем чаще markdown ощущается как корсет. Markdown-файл больше 100 строк я уже физически не читаю — и точно не заставлю прочитать никого из команды. Хочется цвета, диаграмм, плотных таблиц, интерактивных элементов. И хочется чтобы это можно было кинуть ссылкой.</p>

<p>Главный сдвиг тут — <strong>я перестал редактировать эти файлы руками</strong>. Они стали спецификациями, ресёрчами, brainstorming-выходом, отчётами. Когда мне надо что-то поправить, я не лезу в текст — я промпчу Claude. То есть основное преимущество markdown'а (легко редактировать руками) больше не работает в моём флоу.</p>

<p>Я всё ещё храню свой <a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">Second Brain в Obsidian</a> в markdown: сырые голосовые, <code>overview.md</code>, <code>tasks.md</code>, проектные заметки, AGENTS.md. Мой текущий паттерн такой: markdown живёт как source of truth, HTML уходит наружу как readable artifact.</p>

<div class="mvh-callout">
  <div class="mvh-callout-title">Главный поинт</div>
  <p>Markdown оптимизирован под того, кто <strong>пишет</strong> файл. HTML оптимизирован под того, кто <strong>читает и шарит</strong>. Когда писатель — агент, а ты только читатель — выбор очевиден.</p>
</div>

<h2 id="kogda">Короткий ответ: когда HTML, когда Markdown</h2>

<p>HTML-артефакт — это одноразовый файл или страница, которую агент собирает под конкретное решение: план, ревью, отчёт, прототип, сортировку задач. Человек читает, кликает, принимает решения и экспортит результат обратно в prompt, JSON или markdown.</p>

<table>
  <thead>
    <tr><th>Сценарий</th><th>Что выбрать</th><th>Почему</th></tr>
  </thead>
  <tbody>
    <tr><td>Короткая личная заметка</td><td>Markdown</td><td>Быстро, читаемо в source, легко править руками</td></tr>
    <tr><td>Source pack для агента</td><td>Markdown / JSON</td><td>Машине важнее чистый текст и стабильный diff</td></tr>
    <tr><td>Спека или план на 100+ строк</td><td>HTML</td><td>Нужны навигация, визуальные акценты, диаграммы</td></tr>
    <tr><td>PR review для команды</td><td>HTML</td><td>Diff + аннотации + severity читаются быстрее</td></tr>
    <tr><td>Отчёт для не-разработчика</td><td>HTML → PDF</td><td>Открывается везде и не выглядит как сырая простыня</td></tr>
  </tbody>
</table>

<h2 id="pochemu">Почему HTML — 6 причин</h2>

<h3>1. Плотность информации</h3>

<p><a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank" rel="noopener">HTML</a> может представить почти всё, что Claude способен понять:</p>

<ul class="mvh-bullets">
  <li>Структура документа — заголовки, форматирование (как markdown, только богаче)</li>
  <li>Таблицы — нормальные, с merged cells и стилями вместо убогого markdown table</li>
  <li>Дизайн — через CSS</li>
  <li>Иллюстрации и диаграммы — через <a href="https://developer.mozilla.org/en-US/docs/Web/SVG" target="_blank" rel="noopener">SVG</a></li>
  <li>Интерактив — через HTML + JS + CSS</li>
  <li>Воркфлоу и стрелочки — SVG поверх HTML</li>
  <li>Картинки и видео — нативно</li>
  <li>Пространственные данные — absolute positioning, canvas</li>
</ul>

<p>Когда модель лишена этого арсенала, она занимается <em>странным</em> — рисует ASCII-арт или, мой любимый паттерн, пытается передать цвет юникод-символами разной плотности (▒▓█). Это уже карго-культ markdown'а; сила формата тут теряется.</p>

<div class="mvh-diagram">
  <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="240" height="120" fill="#f5f1e8" stroke="#c0392b" stroke-width="2" rx="6"/>
    <text x="140" y="70" text-anchor="middle" font-size="14" font-weight="600" fill="#1a1a1a">Markdown</text>
    <text x="140" y="95" text-anchor="middle" font-size="12" fill="#555">текст</text>
    <text x="140" y="113" text-anchor="middle" font-size="12" fill="#555">заголовки</text>
    <text x="140" y="131" text-anchor="middle" font-size="12" fill="#555">списки</text>
    <text x="140" y="149" text-anchor="middle" font-size="12" fill="#555">ASCII-диаграммы</text>

    <rect x="340" y="20" width="240" height="160" fill="#fff" stroke="#2d7a3e" stroke-width="2" rx="6"/>
    <text x="460" y="48" text-anchor="middle" font-size="14" font-weight="600" fill="#1a1a1a">HTML</text>
    <text x="460" y="70" text-anchor="middle" font-size="11" fill="#555">текст · таблицы · CSS</text>
    <text x="460" y="86" text-anchor="middle" font-size="11" fill="#555">SVG · картинки</text>
    <text x="460" y="102" text-anchor="middle" font-size="11" fill="#555">формы · слайдеры · кнопки</text>
    <text x="460" y="118" text-anchor="middle" font-size="11" fill="#555">live-preview · canvas</text>
    <text x="460" y="134" text-anchor="middle" font-size="11" fill="#555">копи-кнопки → промпт</text>
    <text x="460" y="150" text-anchor="middle" font-size="11" fill="#555">mobile-responsive</text>
    <text x="460" y="166" text-anchor="middle" font-size="11" fill="#2d7a3e" font-weight="600">+ всё то же из markdown</text>

    <path d="M 270 100 L 330 100" stroke="#1a1a1a" stroke-width="2" marker-end="url(#mvh-arrow)"/>
    <defs>
      <marker id="mvh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1a1a"/>
      </marker>
    </defs>
  </svg>
  <div class="mvh-diagram-caption">HTML — это надмножество markdown'а по выразительности</div>
</div>

<h3>2. Читаемость длинных документов</h3>

<p><a href="/claude-code-nastrojka-mcp-hooks-skills-2026/">Claude Code</a> пишет всё более длинные планы и спецификации. На практике markdown-файл больше 100 строк я не дочитываю до конца, и команду тоже не заставлю. HTML же можно нормально структурировать визуально — табы, навигация, sticky оглавление, mobile-responsive вёрстка под телефон vs десктоп.</p>

<p><strong>Личный пример.</strong> Я делаю research-отчёты по on-chain-аналитике TON — на 200-500 строк, со встроенными SQL-запросами, цифрами, ссылками на Dune-дашборды. В markdown'е их читают по диагонали: DE-команда пробежалась глазами, внешние партнёры просто не открывают. С тем же контентом в HTML с SVG-диаграммами потоков и кликабельными ссылками на дашборды open rate был бы радикально выше: визуальная структура помогает физически дочитать до выводов.</p>

<h3>3. Лёгкость шеринга — главный аргумент</h3>

<p>Это, по моим ощущениям, самая <em>недооценённая</em> часть. Markdown в реальной рабочей жизни шарить почти невозможно:</p>

<ul class="mvh-bullets">
  <li><strong>Slack не рендерит markdown-аттачи.</strong> А HTML-файлы Slack вообще не разрешает прикреплять. Получается тупик</li>
  <li>Кидаешь .md программисту — он откроет в Cursor / IDE / Obsidian, увидит рендер. Кидаешь непрограммисту — он смотрит на сырую простыню текста с решётками и звёздочками</li>
  <li>Браузеры markdown нативно не рендерят. Открывается как plaintext</li>
  <li>В мобильных мессенджерах вложенный .md — это «открой и почитай», что никто не делает</li>
</ul>

<p>Поэтому де-факто всегда приходилось делать <strong>HTML → PDF</strong> через <code>print to PDF</code> или какой-нибудь рендерер. PDF открывается везде — в TG, в Slack, на телефоне, в WhatsApp, в почте. Можно делать в формате презентации/слайдов, можно лонгридом.</p>

<p>«Можно же просто конвертить markdown в PDF» — можно. Но тогда получается стоковая, скучная А4-простыня без диаграмм, без структуры, без визуальных акцентов. То есть весь смысл шеринга богатого артефакта теряется. <strong>HTML → PDF выигрывает у Markdown → PDF в каждом раунде.</strong></p>

<p>Итог: HTML — это лучший <em>исходник</em> для шеринга. Дальше либо ссылка (если хостинг есть), либо PDF (если нет).</p>

<h3>4. Двусторонний интерактив</h3>

<p>Это та часть, которая для меня была откровением. HTML может <em>показывать</em> и <em>принимать ввод</em>. Слайдеры для подбора параметров анимации. Drag-and-drop для перетаскивания тикетов между колонками. Live-preview шаблона при редактировании промпта.</p>

<p>Финальный ход — кнопка <code>Copy as JSON</code> или <code>Copy as Prompt</code>, которая собирает результат твоих манипуляций обратно в текст, который ты вставляешь в Claude Code. Получается <strong>одноразовый редактор под конкретную задачу</strong>: артефакт на 30 минут, который можно выкинуть после решения.</p>

<h3>5. Контекст — суперсила Claude Code</h3>

<p>Почему именно Claude Code? Потому что у него есть всё:</p>

<ul class="mvh-bullets">
  <li>Файловая система — может прочитать твой codebase, ai-docs, заметки</li>
  <li><a href="/topics/mcp/">MCP-серверы</a> — Slack, Linear, Coolify, Dune, Telegram</li>
  <li>Git history — кто что менял и когда</li>
  <li>Браузер (через Claude in Chrome) — может полезть и посмотреть</li>
</ul>

<p>Tariq, например, попросил Claude Code пройтись по его папке с кодом, найти все HTML-файлы, которые он генерил раньше, сгруппировать по типу и сделать обзорный HTML с диаграммами. Это и стало основой иллюстраций к его статье. Официальный обзор Claude Code тоже упирается в этот же паттерн: агент читает кодовую базу, редактирует файлы, запускает команды и подключает внешние инструменты через <a href="https://docs.anthropic.com/en/docs/claude-code/overview" target="_blank" rel="noopener">dev workflow</a>.</p>

<h3>6. Это просто кайфово</h3>

<p>Делать HTML-документы с Claude — это весело. Чувствуешь себя создателем, который участвует в форме результата. И этого, в общем, уже достаточно как причины.</p>

<h2 id="sravnenie">Сравнение в одной таблице</h2>

<table>
  <thead>
    <tr><th>Критерий</th><th>Markdown</th><th>HTML</th></tr>
  </thead>
  <tbody>
    <tr><td>Плотность инфы</td><td>Текст + ASCII</td><td>Текст + таблицы + SVG + JS + CSS</td></tr>
    <tr><td>Читаемость 500+ строк</td><td>Никто не читает</td><td>Навигация, табы, mobile</td></tr>
    <tr><td>Шеринг (Slack, TG, mail)</td><td>Файл-аттач, никто не открывает</td><td>Ссылка / PDF из HTML</td></tr>
    <tr><td>Интерактив</td><td>Нет</td><td>Слайдеры, drag-drop, copy-кнопки</td></tr>
    <tr><td>Цвета, иллюстрации</td><td>Эмодзи-костыли</td><td>Нативно</td></tr>
    <tr><td>Токены на генерацию</td><td>×1</td><td>×2–4</td></tr>
    <tr><td>Время генерации</td><td>×1</td><td>×2–4</td></tr>
    <tr><td>Git diff</td><td>Чистый, читаемый</td><td>Шумный, ад</td></tr>
    <tr><td>Кому удобно <em>писать</em> руками</td><td>Тебе</td><td>Никому</td></tr>
    <tr><td>Кому удобно <em>читать</em></td><td>Тебе одному</td><td>Всем, включая телефон</td></tr>
  </tbody>
</table>

<h2 id="markdown">Где Markdown всё ещё лучше</h2>

<p>Markdown я бы не хоронил совсем. Он всё ещё лучший формат для source packs, README, raw voice notes, ai-docs, списков задач и файлов, которые часто меняются в git. Если документ должен жить месяцами, нормально diff'аться и редактироваться руками — HTML превращается в боль.</p>

<p>Мой рубеж простой: короткое и машинно-читаемое — markdown; длинное и человеко-читаемое — HTML. Поэтому в моём <a href="/vtoroj-mozg-ai-assistent-obsidian-claude-code/">Obsidian + Claude Code флоу</a> markdown остаётся операционной памятью, а HTML становится интерфейсом для чтения.</p>

<h2 id="kejsy">Юзкейсы с промптами</h2>

<h3>Спеки, планирование, исследование вариантов</h3>

<p>Когда я начинаю новую задачу, вместо одного markdown-плана я представляю <strong>паутину HTML-файлов</strong>. Сначала прошу побрейнштормить и сделать explorations нескольких подходов. Потом раскручиваю один из них в макет с примерами кода. Финально — план имплементации. В новой сессии передаю всё это пачкой агенту-исполнителю.</p>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Не уверен, в какую сторону пилить экран онбординга. Сгенери 6 принципиально разных подходов — варьируй layout, тон, плотность — и выложи их в один HTML-файл сеткой, чтобы я мог сравнивать side-by-side. Подпиши каждый вариант его tradeoff'ом.</code>
</div>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Сделай подробный имплементационный план в HTML. Добавь mockup'ы, нарисуй data flow в SVG, вставь ключевые куски кода которые я захочу проревьюить. Сделай удобным для сканирования.</code>
</div>

<h3>Code review и понимание чужого кода</h3>

<p>Код в markdown'е читать тяжело. В HTML мы можем рендерить diff'ы с inline-аннотациями, flowchart'ы модулей, color-coded findings по severity. Tariq говорит, что теперь к каждому своему PR прикладывает HTML-описание — и это работает лучше дефолтного гитхабовского diff view.</p>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Помоги мне ревьюить этот PR — сделай HTML-артефакт. Я плохо знаю логику streaming/backpressure, сфокусируйся на ней. Отрендери реальный diff с аннотациями на полях, color-code находки по severity.</code>
</div>

<h3>Дизайн и прототипы</h3>

<p>HTML невероятно выразителен для дизайна — даже если финальный таргет не веб. Claude может набросать дизайн в HTML, а потом перевести его в React/Swift/whatever. И главное — можно прототипировать <em>интеракции</em> вместе со статикой. Про связку design engineering, Figma-to-code и агентов я отдельно писал в <a href="/articles/ai-tools-for-designers-design-engineering-agents/">разборе AI-инструментов для дизайнеров</a>.</p>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Хочу прототипировать новую кнопку checkout. При клике она проигрывает анимацию и быстро становится фиолетовой. Сделай HTML с несколькими слайдерами (длительность, easing, цвет) чтобы я перепробовал варианты. Кнопка copy чтобы скопировать параметры которые сработали.</code>
</div>

<h3>Отчёты, ресёрчи, объяснялки</h3>

<p>Claude Code отлично синтезирует инфу из нескольких источников — Slack, codebase, git history, веб — в единый читаемый отчёт. Можно собирать длинные HTML-документы, интерактивные explainers, даже слайд-деки. SVG-диаграммы — must.</p>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример (мой кейс, on-chain ресёрч)</div>
  <code>Прочитай папку с моим research'ем про buy/sell pressure на одном из TON-маркетплейсов и собери одностраничный HTML-explainer для босса: SVG-схема потока ордеров, 3-4 ключевых SQL-снипета с аннотациями, секция "key findings" вверху, ссылки на Dune-дашборды кликабельные. Оптимизируй под человека, который читает это один раз.</code>
</div>

<h3>Кастомные одноразовые редакторы</h3>

<p>Самый мощный, на мой взгляд, юзкейс. Когда задачу тяжело описать словами в текстбоксе — Claude собирает <strong>throwaway-редактор</strong> под неё. Один HTML-файл, который ты выкинешь после использования. Это хорошо ложится на мой текущий цикл с <a href="/blog/gstack-goal-office-hours-ai-workflow/">GStack, goal и office hours</a>: агент делает механику, человек остаётся в loop'е через понятный артефакт.</p>

<p>Финальный аккорд всегда один: кнопка export — <code>Copy as JSON</code>, <code>Copy as Markdown</code>, <code>Copy as Prompt</code> — которая превращает результат твоих кликов обратно в текст для Claude.</p>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Мне надо переприоритизировать 30 тикетов из Linear. Сделай HTML где каждый тикет — draggable-карточка по колонкам Now / Next / Later / Cut. Предсортируй по своему лучшему пониманию. Кнопка "copy as markdown" чтобы выгрузить финальный порядок с одной строкой обоснования на бакет.</code>
</div>

<div class="mvh-prompt-box">
  <div class="mvh-prompt-label">Промпт-пример</div>
  <code>Тюню системный промпт. Сделай side-by-side редактор: слева редактируемый промпт с подсвеченными переменными, справа три sample input'а которые live-рендерят заполненный шаблон. Добавь счётчик токенов и кнопку copy.</code>
</div>

<p>Что ещё попадает в этот паттерн:</p>

<ul class="mvh-bullets">
  <li>Триаж/сортировка чего угодно (тикеты, тест-кейсы, фидбек)</li>
  <li>Редактирование структурированного конфига (feature flags, env, JSON/YAML с зависимостями)</li>
  <li>Тюнинг промптов с live-preview</li>
  <li>Кураторство датасетов — approve/reject строки, тегирование</li>
  <li>Аннотация документа/транскрипта/diff'а с экспортом аннотаций</li>
  <li>Подбор значений, которые мучительно описывать словами: цвета, easing-кривые, crop-области, cron-расписания, regex'ы</li>
</ul>

<h2 id="minusy">Честные минусы</h2>

<div class="mvh-pros-cons">
  <div class="mvh-pros">
    <h4>За что любим</h4>
    <ul>
      <li>Плотность инфы</li>
      <li>Читаемость длинных документов</li>
      <li>Шеринг ссылкой</li>
      <li>Интерактив + copy-back в промпт</li>
      <li>Контекст из MCP/файлов/git</li>
      <li>Чувство вовлечённости в результат</li>
    </ul>
  </div>
  <div class="mvh-cons">
    <h4>За что ругаем</h4>
    <ul>
      <li>Токены ×2–4 (но в 1M-контексте Opus 4.7 — норм)</li>
      <li>Время генерации ×2–4</li>
      <li>Git diff'ы шумные, ревьюить тяжело</li>
      <li>Без design system Claude генерит generic-хрень</li>
      <li>Нужен браузер чтобы посмотреть</li>
    </ul>
  </div>
</div>

<p>Если делаешь HTML регулярно — заведи <strong>один файл с design system</strong> своего проекта/компании. Можно попросить Claude сгенерить его, посмотрев на твой codebase. Дальше каждый новый HTML генеришь со ссылкой на этот design system — и стиль становится консистентным.</p>

<h2 id="start">Как начать прямо сейчас</h2>

<p>Главное — <strong>не создавай <code>/html</code> skill</strong>. Не надо. Достаточно просто сказать <em>«сделай HTML-файл»</em> или <em>«сделай HTML-артефакт»</em>. Со временем, может быть, оформишь в скилл — но для начала промпчи from scratch, чтобы прочувствовать паттерн в разных кейсах.</p>

<p>Хитрость начинается с понимания, <strong>чего ты хочешь от артефакта</strong> и как ты будешь его использовать.</p>

<div class="mvh-callout">
  <div class="mvh-callout-title">Где смотреть готовые HTML</div>
  <p>Открыть локально через <code>open file.html</code> (Claude Code сам это сделает, если попросить). Для шеринга — залить на S3, GitHub Pages, или в свою mini app.</p>
</div>

<h2 id="faq">FAQ</h2>

<h3>HTML лучше Markdown для AI-агентов?</h3>
<p>Для длинных артефактов — да. Когда агент пишет, а человек читает, HTML даёт больше структуры, визуальной плотности, интерактива и вариантов шеринга. Для коротких заметок и source packs markdown всё ещё проще.</p>

<h3>Когда всё-таки использовать Markdown?</h3>
<p>Короткая заметка, TODO, промпт, meeting note, raw-транскрипт, source pack для агента, README, файл с частыми git diff'ами. Если документ читаешь только ты и он меньше 100 строк — markdown норм.</p>

<h3>HTML-артефакты не слишком дорогие по токенам?</h3>
<p>HTML жрёт больше токенов и обычно дольше генерится. Но если итоговый документ реально читают, trade нормальный. Дешёвый markdown-план, который никто не дочитал, тоже стоит денег — просто это не видно в счёте.</p>

<h3>Как ревьюить diff'ы HTML?</h3>
<p>Это реально больно. Один из главных минусов. Если файл часто меняется — может быть оставь его в markdown.</p>

<h3>Что попросить Claude Code, чтобы HTML не выглядел как generic AI slop?</h3>
<p>Дай агенту контекст: кто читатель, где документ будет открываться, какие секции обязательны, какие стили проекта использовать, что запрещено. Для рабочих артефактов почти всегда помогает прямой запрет на landing page и декоративный SaaS-дизайн.</p>

<hr>

<h2>Stay in the loop</h2>

<p>Финальная мысль автора, которая мне зашла больше всего: реальная причина любви к HTML — это <strong>ощущение, что ты в курсе того, что делает агент</strong>. Когда я перестал читать длинные markdown-планы, у меня появился страх, что я отдал управление и просто доверяю Claude. С HTML я снова в loop'е — потому что артефакт читать действительно интересно.</p>

<div class="mvh-signature">
  Адаптация: Дан Охлопков (<a href="https://t.me/danokhlopkov" target="_blank" rel="noopener">@danokhlopkov</a>) · 2026-05-09<br>
  Оригинал: Tariq, Claude Code team · <a href="https://x.com/trq212/status/2052809885763747935" target="_blank" rel="noopener">x.com/trq212</a>
</div>
`

const ARTICLE_CSS = `
.mvh-page {
  --mvh-bg: #fafaf7;
  --mvh-fg: #1a1a1a;
  --mvh-muted: #555;
  --mvh-accent: #c0392b;
  --mvh-soft: #f5f1e8;
  --mvh-border: #e0dccc;
  --mvh-pro: #2d7a3e;
  --mvh-con: #b03a2e;
  font-family: -apple-system, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
  color: var(--mvh-fg);
  background: var(--mvh-bg);
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  line-height: 1.65;
  font-size: 17px;
}
.mvh-page h1 { font-size: 38px; line-height: 1.15; margin: 0 0 8px; letter-spacing: -0.02em; }
.mvh-page h2 { font-size: 26px; margin: 48px 0 12px; letter-spacing: -0.01em; border-bottom: 2px solid var(--mvh-border); padding-bottom: 6px; }
.mvh-page h3 { font-size: 19px; margin: 28px 0 8px; color: var(--mvh-accent); }
.mvh-page p { margin: 12px 0; }
.mvh-page a { color: var(--mvh-accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
.mvh-page a:hover { text-decoration-thickness: 2px; }
.mvh-page .mvh-meta { color: var(--mvh-muted); font-size: 14px; margin-bottom: 32px; border-bottom: 1px solid var(--mvh-border); padding-bottom: 16px; }
.mvh-page .mvh-meta a { color: var(--mvh-muted); }
.mvh-page .mvh-cover { margin: 0 0 28px; }
.mvh-page .mvh-cover img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; border-radius: 6px; border: 1px solid var(--mvh-border); background: #111; }
.mvh-page blockquote { margin: 20px 0; padding: 14px 20px; background: var(--mvh-soft); border: 1px solid var(--mvh-border); border-radius: 6px; font-style: italic; color: var(--mvh-muted); }
.mvh-page blockquote p { margin: 4px 0; }
.mvh-page .mvh-answer { margin: 20px 0; padding: 16px 20px; border-left: 4px solid var(--mvh-accent); background: #fff; font-size: 16px; }
.mvh-page code { font-family: "SF Mono", "Menlo", "Consolas", monospace; font-size: 14px; background: var(--mvh-soft); padding: 2px 6px; border-radius: 3px; }
.mvh-page table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px; }
.mvh-page th, .mvh-page td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--mvh-border); vertical-align: top; }
.mvh-page th { background: var(--mvh-soft); font-weight: 600; }
.mvh-page .mvh-callout { background: var(--mvh-soft); border: 1px solid var(--mvh-border); border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
.mvh-page .mvh-callout-title { font-weight: 600; margin-bottom: 6px; color: var(--mvh-accent); }
.mvh-page .mvh-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
.mvh-page .mvh-pros, .mvh-page .mvh-cons { padding: 16px 20px; border-radius: 6px; background: var(--mvh-soft); }
.mvh-page .mvh-pros { border: 1px solid rgba(45, 122, 62, 0.26); }
.mvh-page .mvh-cons { border: 1px solid rgba(176, 58, 46, 0.26); }
.mvh-page .mvh-pros h4, .mvh-page .mvh-cons h4 { margin: 0 0 10px; font-size: 15px; }
.mvh-page .mvh-pros h4 { color: var(--mvh-pro); }
.mvh-page .mvh-cons h4 { color: var(--mvh-con); }
.mvh-page .mvh-pros ul, .mvh-page .mvh-cons ul { margin: 0; padding-left: 18px; }
.mvh-page .mvh-pros li, .mvh-page .mvh-cons li { margin: 4px 0; font-size: 15px; }
.mvh-page .mvh-prompt-box { background: #fff; border: 1px solid var(--mvh-border); border-radius: 6px; padding: 14px 18px; margin: 14px 0; font-size: 15px; }
.mvh-page .mvh-prompt-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mvh-accent); font-weight: 600; margin-bottom: 6px; }
.mvh-page .mvh-prompt-box code { background: none; padding: 0; font-style: italic; color: var(--mvh-fg); font-family: inherit; font-size: 15px; }
.mvh-page ul.mvh-bullets { list-style: none; padding-left: 0; }
.mvh-page ul.mvh-bullets li { padding-left: 22px; position: relative; margin: 8px 0; }
.mvh-page ul.mvh-bullets li::before { content: "▪"; position: absolute; left: 4px; color: var(--mvh-accent); font-weight: bold; }
.mvh-page .mvh-toc { background: var(--mvh-soft); border-radius: 6px; padding: 16px 24px; margin: 24px 0 40px; font-size: 15px; }
.mvh-page .mvh-toc-title { font-weight: 600; margin-bottom: 8px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; color: var(--mvh-muted); }
.mvh-page .mvh-toc ol { margin: 0; padding-left: 20px; }
.mvh-page .mvh-toc li { margin: 4px 0; }
.mvh-page .mvh-toc a { color: var(--mvh-fg); text-decoration: none; }
.mvh-page .mvh-toc a:hover { color: var(--mvh-accent); }
.mvh-page .mvh-diagram { background: #fff; border: 1px solid var(--mvh-border); border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center; }
.mvh-page .mvh-diagram svg { max-width: 100%; height: auto; }
.mvh-page .mvh-diagram-caption { font-size: 13px; color: var(--mvh-muted); margin-top: 8px; font-style: italic; }
.mvh-page .mvh-signature { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--mvh-border); color: var(--mvh-muted); font-size: 14px; }
.mvh-page hr { border: none; border-top: 1px solid var(--mvh-border); margin: 32px 0; }
@media (max-width: 600px) {
  .mvh-page { font-size: 16px; padding: 16px 16px 60px; }
  .mvh-page h1 { font-size: 30px; }
  .mvh-page h2 { font-size: 22px; }
  .mvh-page table { display: block; overflow-x: auto; white-space: normal; }
  .mvh-page .mvh-pros-cons { grid-template-columns: 1fr; }
}
`

export function MarkdownVsHtml() {
  const canonical = absoluteUrl('/articles/markdown-vs-html/')
  const description = 'Почему HTML лучше Markdown для AI-агентов: когда агент пишет артефакты, а человек читает и шарит. Сравнение форматов, минусы и промпты.'
  const title = 'Markdown vs HTML для AI-агентов | Даниил Охлопков'
  const tags = ['AI Agents', 'HTML', 'Markdown', 'Claude Code']

  useDocumentMeta({
    title,
    description,
    canonical,
    type: 'article',
    publishedTime: '2026-05-09',
    modifiedTime: '2026-05-29',
    image: absoluteUrl(COVER_IMAGE),
    imageAlt: COVER_ALT,
    tags,
    section: 'Статьи',
    jsonLd: buildArticleStructuredData({
      title,
      description,
      canonical,
      publishedAt: '2026-05-09',
      updatedAt: '2026-05-29',
      image: COVER_IMAGE,
      tags,
      section: 'Статьи',
      bodyText: htmlToPlainText(ARTICLE_HTML),
    }),
  })

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_CSS }} />
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Markdown мёртв — да здравствует HTML</h1>
        <p className="subpage-subtitle">
          Из курса · перевод поста Tariq из команды Claude Code, с моими примерами
        </p>
      </div>
      <article id="article-content" className="mvh-page" dangerouslySetInnerHTML={{ __html: ARTICLE_HTML }} />
      <Footer />
    </div>
  )
}
