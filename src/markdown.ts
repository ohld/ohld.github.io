function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function inlineFormat(value: string) {
  let html = escapeHtml(value)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => (
    `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" decoding="async" />`
  ))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => (
    `<a href="${escapeAttr(url)}">${text}</a>`
  ))
  return html
}

function isTableDivider(line: string) {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)
}

function splitTableRow(line: string) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let paragraph: string[] = []
  const listStack: Array<{ tag: 'ul' | 'ol', indent: number, openLi: boolean }> = []
  let inQuote = false
  let inCode = false
  let codeLines: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    out.push(`<p>${inlineFormat(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const closeListLevel = () => {
    const current = listStack.pop()
    if (!current) return
    if (current.openLi) out.push('</li>')
    out.push(`</${current.tag}>`)
  }
  const closeList = () => {
    while (listStack.length) closeListLevel()
  }
  const writeListItem = (tag: 'ul' | 'ol', indent: number, content: string) => {
    while (listStack.length && indent < listStack[listStack.length - 1].indent) {
      closeListLevel()
    }

    let current = listStack[listStack.length - 1]
    if (current && indent === current.indent && current.tag !== tag) {
      closeListLevel()
      current = listStack[listStack.length - 1]
    }
    if (!current || indent > current.indent || current.tag !== tag) {
      if (current && current.openLi && indent <= current.indent) {
        out.push('</li>')
        current.openLi = false
      }
      out.push(`<${tag}>`)
      listStack.push({ tag, indent, openLi: false })
    } else if (current.openLi) {
      out.push('</li>')
      current.openLi = false
    }

    const active = listStack[listStack.length - 1]
    out.push(`<li>${inlineFormat(content)}`)
    active.openLi = true
  }
  const closeQuote = () => {
    if (!inQuote) return
    out.push('</blockquote>')
    inQuote = false
  }
  const flushCode = () => {
    if (!inCode) return
    out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    codeLines = []
    inCode = false
  }

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index]
    const line = raw.trimEnd()

    if (inCode) {
      if (line.startsWith('```')) {
        flushCode()
        continue
      }
      codeLines.push(raw)
      continue
    }

    if (line.startsWith('```')) {
      flushParagraph()
      closeList()
      closeQuote()
      inCode = true
      codeLines = []
      continue
    }
    if (!line.trim()) {
      flushParagraph()
      closeList()
      closeQuote()
      continue
    }
    if (line.trim() === '>') {
      flushParagraph()
      closeList()
      closeQuote()
      continue
    }
    if (line.startsWith('|') && lines[index + 1]?.trimEnd().startsWith('|') && isTableDivider(lines[index + 1].trimEnd())) {
      flushParagraph()
      closeList()
      closeQuote()
      const headers = splitTableRow(line)
      index += 2
      const bodyRows: string[][] = []
      while (index < lines.length && lines[index].trimEnd().startsWith('|')) {
        bodyRows.push(splitTableRow(lines[index].trimEnd()))
        index += 1
      }
      index -= 1
      out.push(
        `<div class="article-table-wrap"><table class="article-table"><thead><tr>${
          headers.map((cell) => `<th>${inlineFormat(cell)}</th>`).join('')
        }</tr></thead><tbody>${
          bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${inlineFormat(cell)}</td>`).join('')}</tr>`).join('')
        }</tbody></table></div>`
      )
      continue
    }
    if (line.startsWith('### ')) {
      flushParagraph()
      closeList()
      closeQuote()
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      closeList()
      closeQuote()
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      flushParagraph()
      closeList()
      closeQuote()
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`)
      continue
    }
    const unordered = raw.match(/^(\s*)([-*•▪])\s+(.+)$/)
    if (unordered) {
      flushParagraph()
      closeQuote()
      writeListItem('ul', unordered[1].replace(/\t/g, '  ').length, unordered[3])
      continue
    }
    const ordered = raw.match(/^(\s*)\d+[.)]\s+(.+)$/)
    if (ordered) {
      flushParagraph()
      closeQuote()
      writeListItem('ol', ordered[1].replace(/\t/g, '  ').length, ordered[2])
      continue
    }
    if (line.startsWith('> ')) {
      flushParagraph()
      closeList()
      if (!inQuote) {
        out.push('<blockquote class="article-quote">')
        inQuote = true
      }
      out.push(`<p>${inlineFormat(line.slice(2))}</p>`)
      continue
    }
    if (line.startsWith('---')) {
      flushParagraph()
      closeList()
      closeQuote()
      out.push('<hr />')
      continue
    }

    closeList()
    closeQuote()
    paragraph.push(line)
  }

  flushParagraph()
  closeList()
  closeQuote()
  flushCode()

  return out.join('\n')
}
