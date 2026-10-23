/**
 * Print pipeline for the pedagogical documents.
 *
 * The app keeps its printable markup inside the normal screen layout, which
 * means `window.print()` on the page would also print the sidebar, toolbars and
 * navigation. Instead we mirror the requested document into an off-screen
 * iframe together with the app stylesheets, then print only that frame. The
 * browser's own print dialog doubles as the live preview (A4, with real page
 * breaks), so what the teacher sees is exactly what the printer receives.
 */

export interface PrintOptions {
  /** Document title used for the browser's "save as PDF" file name. */
  title?: string;
  /** Wide tables (grades roster, timetable) read better on A4 landscape. */
  landscape?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Copies the app's stylesheets (Tailwind + custom tokens + print rules). */
function collectStyles(): string {
  const nodes = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"], style'),
  );
  return nodes.map(node => node.outerHTML).join('\n');
}

/**
 * Prints the element with the given id inside a self-contained frame.
 * Returns `false` when the element is missing so callers can fall back to an
 * on-screen message instead of failing silently.
 */
export function printElement(elementId: string, options: PrintOptions = {}): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const source = document.getElementById(elementId);
  if (!source) return false;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('tabindex', '-1');
  frame.title = options.title || document.title;
  frame.style.cssText =
    'position:fixed;inset-inline-start:-10000px;top:0;width:1000px;height:1200px;border:0;';
  document.body.appendChild(frame);

  const frameDocument = frame.contentDocument;
  if (!frameDocument) {
    frame.remove();
    return false;
  }

  const pageSize = options.landscape ? 'A4 landscape' : 'A4 portrait';
  const title = escapeHtml(options.title || document.title);
  const styles = collectStyles();

  frameDocument.open();
  frameDocument.write(
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
      `<title>${title}</title>${styles}` +
      '<style>' +
      'html,body{background:#fff;color:#000;}' +
      'body{margin:0;padding:0;}' +
      `@page{size:${pageSize};margin:8mm;}` +
      'table{page-break-inside:auto;}tr{page-break-inside:avoid;}' +
      '.print\\:hidden,button,[role="button"]{display:none!important;}' +
      '</style></head><body>' +
      source.innerHTML +
      '</body></html>',
  );
  frameDocument.close();

  const triggerPrint = () => {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) {
      frame.remove();
      return;
    }
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => frame.remove(), 1500);
  };

  // One tick for the copied stylesheets/fonts to apply before the preview opens.
  window.setTimeout(triggerPrint, 300);
  return true;
}
