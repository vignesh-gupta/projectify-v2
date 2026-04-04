export function formatChangelogDate(timestamp?: number) {
  if (!timestamp) {
    return "Not published"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp)
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function isLegacyHtmlContent(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function renderInlineMarkdown(value: string) {
  const escaped = escapeHtml(value)

  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    )
}

function renderMarkdownParagraphs(value: string) {
  const blocks = value
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const htmlBlocks = blocks.map((block) => {
    if (/^#{1,6}\s+/.test(block)) {
      const [, hashes, text] = block.match(/^(#{1,6})\s+([\s\S]+)$/) ?? []
      const level = hashes?.length ?? 1
      return `<h${level}>${renderInlineMarkdown(text ?? "")}</h${level}>`
    }

    if (/^>\s?/m.test(block)) {
      const lines = block
        .split("\n")
        .map((line) => line.replace(/^>\s?/, "").trim())
        .filter(Boolean)
      return `<blockquote><p>${lines.map(renderInlineMarkdown).join("<br />")}</p></blockquote>`
    }

    if (/^(-|\*)\s+/m.test(block)) {
      const items = block
        .split("\n")
        .map((line) => line.match(/^(-|\*)\s+([\s\S]+)$/)?.[2]?.trim())
        .filter((item): item is string => Boolean(item))
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("")
      return `<ul>${items}</ul>`
    }

    if (/^\d+\.\s+/m.test(block)) {
      const items = block
        .split("\n")
        .map((line) => line.match(/^\d+\.\s+([\s\S]+)$/)?.[1]?.trim())
        .filter((item): item is string => Boolean(item))
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("")
      return `<ol>${items}</ol>`
    }

    if (/^```[\s\S]*```$/.test(block)) {
      const code = block.replace(/^```[\w-]*\n?/, "").replace(/\n?```$/, "")
      return `<pre><code>${escapeHtml(code)}</code></pre>`
    }

    if (/^---+$/.test(block)) {
      return "<hr />"
    }

    return `<p>${block
      .split("\n")
      .map((line) => renderInlineMarkdown(line.trim()))
      .join("<br />")}</p>`
  })

  return htmlBlocks.join("\n")
}

export function renderChangelogContent(value: string) {
  if (!value.trim()) {
    return ""
  }

  if (isLegacyHtmlContent(value)) {
    return value
  }

  return renderMarkdownParagraphs(value)
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function changelogPlainText(value: string) {
  return stripHtml(renderChangelogContent(value))
}

export function formatVersion(version: string) {
  return `v ${version}`
}
