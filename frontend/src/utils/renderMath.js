import katex from 'katex';

/**
 * HTML escapes unsafe characters to prevent XSS.
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses text containing LaTeX math ($...$ or $$...$$) and returns safe HTML
 * where math spans are rendered via KaTeX and all other segments are HTML-escaped.
 */
export function renderSafeMathHtml(text) {
  if (!text) return '';

  // Regex to match block math $$...$$ or inline math $...$
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;

  let lastIndex = 0;
  let result = '';
  let match;

  while ((match = mathRegex.exec(text)) !== null) {
    // Non-math text before this match
    if (match.index > lastIndex) {
      const nonMath = text.slice(lastIndex, match.index);
      result += escapeHtml(nonMath);
    }

    const rawMatch = match[0];
    const isBlock = rawMatch.startsWith('$$') && rawMatch.endsWith('$$');
    const mathContent = isBlock ? rawMatch.slice(2, -2) : rawMatch.slice(1, -1);

    try {
      const rendered = katex.renderToString(mathContent, {
        displayMode: isBlock,
        throwOnError: false,
      });
      result += rendered;
    } catch {
      result += escapeHtml(rawMatch);
    }

    lastIndex = mathRegex.lastIndex;
  }

  // Append any remaining text after last math match
  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  return result;
}
