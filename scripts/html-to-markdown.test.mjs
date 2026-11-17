import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { htmlToMarkdown } from './html-to-markdown.mjs'

test('imported article HTML keeps headings, tables, lists, code and links', () => {
  const markdown = htmlToMarkdown([
    '<p>Intro with <strong><code>/compact</code></strong> and a <a href="/about/?a=1&amp;b=2">link</a>.</p>',
    '<section class="article-callout"><h2 id="x">Quick &amp; short</h2><ul><li>one</li><li>two</li></ul></section>',
    '<ol><li>first</li><li>second</li></ol>',
    '<table><thead><tr><th>Phrase</th><th>Meaning</th></tr></thead><tbody><tr><td><code>a | b</code></td><td>Runs it.</td></tr></tbody></table>',
    '<pre><code class="language-bash">echo &lt;hi&gt;\n\necho done</code></pre>',
    '<blockquote><p>Quoted</p><p>twice</p></blockquote><h3>Sub</h3><p>End.</p>',
  ].join(''))
  assert.equal(markdown, [
    'Intro with **`/compact`** and a [link](/about/?a=1&b=2).',
    '## Quick & short',
    '- one\n- two',
    '1. first\n2. second',
    '| Phrase | Meaning |\n| --- | --- |\n| `a \\| b` | Runs it. |',
    '```bash\necho <hi>\n\necho done\n```',
    '> Quoted\n>\n> twice',
    '### Sub',
    'End.',
  ].join('\n\n'))
})

test('nested ordered and unordered lists retain hierarchy and numbering', () => {
  assert.equal(htmlToMarkdown('<ol><li>first<ul><li>nested</li></ul></li><li>second</li></ol>'), '1. first\n    - nested\n2. second')
})

test('code containing Markdown fences stays inside a longer fence', () => {
  assert.equal(htmlToMarkdown('<pre><code>```sh\necho &#x1f44b;\n```</code></pre>'), '````\n```sh\necho 👋\n```\n````')
})

test('inline code preserves literal backticks and leading and trailing spaces', () => {
  assert.equal(htmlToMarkdown('<p>Use <code>`ls`</code> and <code> padded </code>.</p>'), 'Use `` `ls` `` and `  padded  `.')
})

test('links use the href on the opening tag with optional spaces around equals', () => {
  const html = `<a data-href="/tracking/" title='x href="/tooltip/"' href = '/article/'><span title="href='/nested/'">Article</span></a>`
  assert.equal(htmlToMarkdown(html), '[Article](/article/)')
})

test('real imported articles retain every section heading', () => {
  const articles = JSON.parse(fs.readFileSync(new URL('../content/articles/imported-content.json', import.meta.url), 'utf8'))
  let checked = 0
  for (const article of articles) {
    const headings = [...article.bodyHtml.matchAll(/<h([2-6])\b[^>]*>/gi)]
    if (!headings.length) continue
    const markdown = htmlToMarkdown(article.bodyHtml)
    // Code examples may themselves contain Markdown headings. Check each actual HTML
    // heading's converted text rather than counting example lines as headings.
    for (const heading of article.bodyHtml.matchAll(/<h([2-6])\b[^>]*>[\s\S]*?<\/h\1>/gi)) {
      assert.ok(markdown.includes(htmlToMarkdown(heading[0])), article.path)
    }
    checked++
  }
  assert.ok(checked > 0)
})
