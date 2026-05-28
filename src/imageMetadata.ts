interface ImageDimensions {
  width: number
  height: number
}

const IMAGE_DIMENSIONS: Record<string, ImageDimensions> = {
  '/assets/articles/ai-reels-seo-pipeline-telegram-claude-code/raw-source-pack-meme.webp': { width: 736, height: 808 },
  '/assets/articles/ai-reels-seo-pipeline-telegram-claude-code/reels-seo-cover.webp': { width: 1280, height: 720 },
  '/assets/articles/ai-reels-seo-pipeline-telegram-claude-code/shadow-account-meme.webp': { width: 736, height: 808 },
  '/assets/articles/ai-tools-for-designers-design-engineering-agents/design-engineering-cover.webp': { width: 1200, height: 675 },
  '/assets/articles/hermes-agent-vs-openclaw/hermes-openclaw-cover.webp': { width: 1280, height: 720 },
  '/assets/articles/hermes-agent-vs-openclaw/security-allowlist.webp': { width: 1376, height: 768 },
  '/assets/articles/hermes-agent-vs-openclaw/setup-cron-home.webp': { width: 1376, height: 768 },
  '/assets/articles/hermes-agent-vs-openclaw/telegram-remote-control.webp': { width: 1376, height: 768 },
  '/assets/blog/ai-agents-s-chego-nachat/ai-agents-playlist-meme.webp': { width: 1280, height: 720 },
  '/assets/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/company-context-cover.webp': { width: 1280, height: 720 },
  '/assets/blog/business-on-ai-agent-claude-code-paperclip-gstack/business-agents-cover.webp': { width: 1280, height: 720 },
  '/assets/blog/claude-code-vs-codex-perehod/telegram-cover.webp': { width: 1280, height: 720 },
  '/assets/blog/gstack-goal-office-hours-ai-workflow/telegram-cover.webp': { width: 1280, height: 720 },
  '/assets/blog/improve-codebase-architecture-prompt/architecture-prompt-cover.webp': { width: 1280, height: 720 },
  '/assets/blog/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty/phone-agent-meme.webp': { width: 1280, height: 720 },
  '/assets/blog/vibecoding-telegram-mini-app-claude-code/tma-llms-cover.webp': { width: 1280, height: 720 },
}

export function imageDimensionsForUrl(url?: string): ImageDimensions | undefined {
  if (!url) return undefined
  try {
    const pathname = url.startsWith('http') ? new URL(url).pathname : url
    return IMAGE_DIMENSIONS[pathname.split('?')[0]]
  } catch {
    return IMAGE_DIMENSIONS[url.split('?')[0]]
  }
}
