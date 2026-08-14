/**
 * Captures a DOM element with all computed styles inlined and downloads it
 * as a self-contained, standalone HTML file. The output includes a branded
 * banner with the screen title and export timestamp, matching the reference
 * export format.
 */

interface ExportOptions {
  title: string;
  subtitle?: string;
}

export function downloadElementAsHtml(
  rootElement: HTMLElement,
  { title, subtitle }: ExportOptions,
): void {
  const clone = rootElement.cloneNode(true) as HTMLElement;

  inlineComputedStyles(rootElement, clone);
  sanitizeClone(clone);

  const html = wrapInHtmlDocument(clone, title, subtitle);
  triggerDownload(html, title);
}

/* Inline the computed style of every element so the export renders correctly
   without any external CSS files. */
function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  target.setAttribute('style', computedStyleText(source));

  const sourceElements = Array.from(source.querySelectorAll('*')) as HTMLElement[];
  const targetElements = Array.from(target.querySelectorAll('*')) as HTMLElement[];

  for (let i = 0; i < sourceElements.length; i++) {
    const styleText = computedStyleText(sourceElements[i]);
    if (styleText) {
      targetElements[i].setAttribute('style', styleText);
    }
  }
}

function computedStyleText(el: HTMLElement): string {
  const computed = window.getComputedStyle(el);
  // cssText on a computed style declaration gives all non-default values
  // in a compact string — supported in all modern browsers.
  if (computed.cssText) return computed.cssText;

  // Fallback: iterate properties manually
  const parts: string[] = [];
  for (let i = 0; i < computed.length; i++) {
    const prop = computed.item(i);
    const value = computed.getPropertyValue(prop);
    if (value) parts.push(`${prop}: ${value}`);
  }
  return parts.join('; ');
}

/* Remove interactive elements and event handlers so the exported file is
   a static snapshot. */
function sanitizeClone(clone: HTMLElement): void {
  // Remove scripts entirely
  clone.querySelectorAll('script').forEach((el) => el.remove());

  // Replace canvas elements with a placeholder (can't capture drawn content)
  clone.querySelectorAll('canvas').forEach((el) => {
    const placeholder = document.createElement('div');
    placeholder.style.cssText =
      'padding:24px;text-align:center;color:#94a3b8;font-size:12px;border:1px dashed #cbd5e1;border-radius:8px;';
    placeholder.textContent = '[Visual content not available in export]';
    el.replaceWith(placeholder);
  });

  // Strip all inline event handler attributes
  const interactiveAttrs = [
    'onclick', 'onchange', 'onsubmit', 'onload', 'onerror',
    'onmouseover', 'onmouseout', 'oninput', 'onkeydown', 'onkeyup',
  ];
  clone.querySelectorAll('*').forEach((el) => {
    interactiveAttrs.forEach((attr) => el.removeAttribute(attr));
  });

  // Neutralise buttons — keep their text but remove pointer cursor
  clone.querySelectorAll('button').forEach((el) => {
    el.style.cursor = 'default';
    el.removeAttribute('disabled');
  });

  // Make inputs read-only visually (keep their current value as text)
  clone.querySelectorAll('input, textarea, select').forEach((el) => {
    const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value =
      input.tagName === 'SELECT'
        ? (input as HTMLSelectElement).options[input.selectedIndex]?.text ?? ''
        : input.value ?? '';
    const span = document.createElement('span');
    span.textContent = value;
    span.style.cssText = input.style.cssText + ';display:inline-block;';
    el.replaceWith(span);
  });
}

function wrapInHtmlDocument(
  content: HTMLElement,
  title: string,
  subtitle?: string,
): string {
  const exportDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const banner = `
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:16px 24px;font-family:'Inter',system-ui,sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="font-size:18px;font-weight:700;margin:0;color:#fff;">${escapeHtml(title)}</h1>
          ${subtitle ? `<p style="font-size:12px;color:#67e8f9;margin:4px 0 0 0;">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <p style="font-size:11px;color:#94a3b8;margin:0;">Exported on ${exportDate}</p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0 0;">EPI Project Monitoring System</p>
        </div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(title)} — Exported on ${exportDate}" />
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin:0; padding:0; font-family:'Inter',system-ui,sans-serif; background:#f1f5f9; }
  </style>
</head>
<body>
  ${banner}
  ${content.outerHTML}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(html: string, title: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = title.replace(/[^a-zA-Z0-9]+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `${safeName}_Export_${dateStr}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
