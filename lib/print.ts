/**
 * Print pipeline for the pedagogical documents.
 *
 * The app keeps its printable markup inside the normal screen layout, which
 * means `window.print()` on the page would also print the sidebar, toolbars and
 * navigation. Instead we mirror the requested document into an off-screen
 * iframe together with the app stylesheets, then print only that frame. The
 * browser's own print dialog doubles as the live preview (A4, with real page
 * breaks), so what the teacher sees is exactly what the printer receives.
 *
 * Everything printed here is Arabic: the frame is forced to `dir="rtl"` and the
 * stylesheet below re-centres the page on A4 with tight margins and compact
 * type, so a term document fits on one or two sheets instead of four.
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
 * Print-only stylesheet. It is written into the frame *after* the app sheets so
 * it always wins, and it only targets `.print-sheet`, never the app itself.
 */
const PRINT_CSS = `
@page { margin: 7mm 7mm 8mm; }
html, body { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; }
body { direction: rtl !important; text-align: right !important; font-size: 9.5pt !important; line-height: 1.3 !important; }
.print-sheet { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; direction: rtl !important; text-align: right !important; color: #000 !important; background: #fff !important; font-size: 9.5pt !important; line-height: 1.3 !important; }
.print-sheet > * { max-width: none !important; width: 100% !important; margin-top: 0 !important; margin-bottom: 0 !important; padding-left: 0 !important; padding-right: 0 !important; border-left: 0 !important; border-right: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; }
.print-sheet [class*="space-y-"] > * + * { margin-top: 4px !important; }
.print-sheet [class*="gap-"] { gap: 5px !important; }
.print-sheet [class*="rounded-"] { border-radius: 0 !important; }
.print-sheet [class*="shadow"] { box-shadow: none !important; }
.print-sheet .no-print, .print-sheet nav, .print-sheet aside { display: none !important; }
/* Decorative icons are noise on paper; marking buttons keep their text and colours. */
.print-sheet svg { display: none !important; }
.print-sheet *:not(button):not(button *) { color: #000 !important; }
.print-sheet [class*="bg-linear"], .print-sheet [class*="bg-gradient"],
.print-sheet [class*="bg-white/"] { background: #fff !important; }
.print-sheet button, .print-sheet [role="button"] {
  min-height: 0 !important;
  padding: 1px 4px !important;
  border-radius: 0 !important;
  font-size: 8.5pt !important;
  line-height: 1.2 !important;
  box-shadow: none !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.print-sheet .absolute { display: none !important; }
.print-sheet h1, .print-sheet h2 { font-size: 12pt !important; line-height: 1.25 !important; margin: 2px 0 !important; }
.print-sheet h3 { font-size: 11pt !important; line-height: 1.25 !important; margin: 2px 0 !important; }
.print-sheet h4, .print-sheet h5, .print-sheet h6 { font-size: 10pt !important; line-height: 1.25 !important; margin: 2px 0 !important; }
.print-sheet p { margin: 0 0 3px !important; }
.print-sheet img { max-width: 100% !important; height: auto !important; }
.print-sheet table { width: 100% !important; border-collapse: collapse !important; font-size: 8.5pt !important; table-layout: auto !important; }
.print-sheet thead { display: table-header-group !important; }
.print-sheet tfoot { display: table-footer-group !important; }
.print-sheet tr { page-break-inside: avoid !important; break-inside: avoid !important; }
.print-sheet th, .print-sheet td { padding: 2px 4px !important; border: 1px solid #334155 !important; vertical-align: middle !important; }
.print-sheet th { background: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.print-sheet .text-3xl { font-size: 14pt !important; }
.print-sheet .text-2xl { font-size: 12pt !important; }
.print-sheet .text-xl { font-size: 11pt !important; }
.print-sheet .p-6, .print-sheet .p-5 { padding: 4px !important; }
.print-sheet .p-4 { padding: 3px !important; }
.print-sheet .p-3 { padding: 2px !important; }
.print-sheet .py-6, .print-sheet .py-5 { padding-block: 3px !important; }
.print-sheet .print-avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
.print-sheet .print-page-break { page-break-before: always !important; break-before: page !important; }
.print-sheet .min-w-\\[640px\\], .print-sheet .min-w-\\[850px\\] { min-width: 0 !important; }
`;

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
      `<style>${PRINT_CSS}@page { size: ${pageSize}; }</style>` +
      '</head><body dir="rtl"></body></html>',
  );
  frameDocument.close();

  // Clone the element itself (not just its HTML): printing a <table> target then
  // keeps its <table> wrapper, and its Tailwind classes stay available.
  const wrapper = frameDocument.createElement('div');
  wrapper.className = 'print-sheet';
  wrapper.setAttribute('dir', 'rtl');
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.removeAttribute('style');
  wrapper.appendChild(clone);
  frameDocument.body.appendChild(wrapper);

  const cleanup = () => frame.remove();
  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    const frameWindow = frame.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 1500);
  };

  // Wait for the copied stylesheets, the Arabic webfont and the images before
  // opening the preview: a fixed delay either raced the font or wasted time.
  const hardTimeout = window.setTimeout(triggerPrint, 2500);
  const fontSet = (frameDocument as Document & { fonts?: FontFaceSet }).fonts;
  const fontsReady: Promise<unknown> = fontSet?.ready ?? Promise.resolve();
  const imagesReady = Array.from(frameDocument.images).map(image =>
    image.complete
      ? Promise.resolve()
      : new Promise<void>(resolve => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
  );

  void Promise.all([fontsReady, ...imagesReady]).then(() => {
    window.clearTimeout(hardTimeout);
    // One frame so the cloned markup is laid out before the preview opens.
    window.requestAnimationFrame(() => window.setTimeout(triggerPrint, 40));
  });

  return true;
}
