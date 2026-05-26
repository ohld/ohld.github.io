import { trackCodeCopy } from './analytics'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function detectCodeLanguage(value: string) {
  const text = value.trim()
  if (!text) return 'text'
  if ((text.startsWith('{') || text.startsWith('['))) {
    try {
      JSON.parse(text)
      return 'json'
    } catch {
      return 'text'
    }
  }
  if (/^#\s|^##\s|^- \*\*|^\d+\.\s/m.test(text)) return 'markdown'
  if (/^#!|(^|\n)\s*(npm|npx|pnpm|yarn|git|curl|docker|dokku|python|pip|pytest|if |fi\b|echo\b|grep\b)/m.test(text)) return 'shell'
  if (/\b(select|from|where|join|group by|order by)\b/i.test(text)) return 'sql'
  if (/\b(def|class|import|from)\b/.test(text) && /:\s*(\n|$)/.test(text)) return 'python'
  return 'text'
}

function highlightLine(rawLine: string, language: string) {
  const escaped = escapeHtml(rawLine)
  const trimmed = rawLine.trim()

  if (language === 'markdown') {
    if (trimmed.startsWith('#')) {
      return `<span class="code-token-keyword">${escaped}</span>`
    }
    return escaped
      .replace(/^(\s*[-*]\s+)/, '<span class="code-token-keyword">$1</span>')
      .replace(/^(\s*\d+\.\s+)/, '<span class="code-token-keyword">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<span class="code-token-strong">**$1**</span>')
  }

  if (language === 'json') {
    return escaped
      .replace(/(&quot;[^&]+&quot;)(\s*:)/g, '<span class="code-token-key">$1</span>$2')
      .replace(/\b(true|false|null)\b/g, '<span class="code-token-keyword">$1</span>')
      .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="code-token-number">$1</span>')
  }

  if (language === 'shell') {
    if (trimmed.startsWith('#')) return `<span class="code-token-comment">${escaped}</span>`
    return escaped
      .replace(/^(\s*)(npm|npx|pnpm|yarn|git|curl|docker|dokku|python|pip|pytest|if|fi|echo|grep)\b/g, '$1<span class="code-token-keyword">$2</span>')
      .replace(/(&quot;[^&]*&quot;|'[^']*')/g, '<span class="code-token-string">$1</span>')
  }

  if (language === 'sql') {
    return escaped.replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|GROUP BY|ORDER BY|LIMIT|WITH|AS|ON|AND|OR)\b/gi, '<span class="code-token-keyword">$1</span>')
  }

  if (language === 'python') {
    return escaped
      .replace(/^(\s*#.*)$/, '<span class="code-token-comment">$1</span>')
      .replace(/\b(def|class|import|from|return|if|else|elif|for|while|in|with|as)\b/g, '<span class="code-token-keyword">$1</span>')
      .replace(/(&quot;[^&]*&quot;|'[^']*')/g, '<span class="code-token-string">$1</span>')
  }

  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return `<span class="code-token-comment">${escaped}</span>`
  }

  return escaped
}

function highlightCode(value: string, language: string) {
  return value.split('\n').map((line) => highlightLine(line, language)).join('\n')
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function copyLabels() {
  const lang = document.documentElement.lang
  if (lang === 'ru') {
    return {
      copy: 'Копировать',
      copied: 'Скопировано',
      error: 'Ошибка',
    }
  }
  return {
    copy: 'Copy',
    copied: 'Copied',
    error: 'Error',
  }
}

export function enhanceCodeBlocks(root: ParentNode = document) {
  const blocks = root.querySelectorAll<HTMLElement>('.generated-blog-body pre, .blog-article section pre')
  const labels = copyLabels()
  blocks.forEach((pre) => {
    if (pre.dataset.codeEnhanced === 'true' || pre.closest('.code-block')) return
    const code = pre.querySelector('code')
    if (!code) return

    const rawCode = code.textContent || ''
    const language = code.getAttribute('data-language') || detectCodeLanguage(rawCode)
    code.innerHTML = highlightCode(rawCode, language)
    pre.dataset.codeEnhanced = 'true'

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    wrapper.setAttribute('data-language', language)

    const header = document.createElement('div')
    header.className = 'code-block-header'

    const label = document.createElement('span')
    label.className = 'code-block-label'
    label.textContent = language

    const button = document.createElement('button')
    button.className = 'code-block-copy'
    button.type = 'button'
    button.textContent = labels.copy
    button.addEventListener('click', async () => {
      try {
        await copyToClipboard(rawCode)
        trackCodeCopy(language)
        button.textContent = labels.copied
        window.setTimeout(() => { button.textContent = labels.copy }, 1400)
      } catch {
        button.textContent = labels.error
        window.setTimeout(() => { button.textContent = labels.copy }, 1400)
      }
    })

    header.append(label, button)
    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.append(header, pre)
  })
}
