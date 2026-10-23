import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRINT_CSS } from '@/lib/print';

/**
 * The printed document is the one the teacher hands to the administration, so the
 * following invariants are part of the product, not styling preferences: Arabic RTL,
 * A4 with tight margins, compact type and no rows split across sheets.
 */
describe('A4 print frame', () => {
  it('forces a right-to-left Arabic page', () => {
    expect(PRINT_CSS).toContain('direction: rtl');
    expect(PRINT_CSS).toContain('text-align: right');
  });

  it('keeps the A4 margins tight enough for one or two sheets', () => {
    expect(PRINT_CSS).toContain('@page { margin: 7mm 7mm 8mm; }');
    expect(PRINT_CSS).toContain('font-size: 9.5pt');
    expect(PRINT_CSS).toContain('font-size: 8.5pt');
  });

  it('repeats table headers and never splits a row', () => {
    expect(PRINT_CSS).toContain('thead { display: table-header-group');
    expect(PRINT_CSS).toContain('page-break-inside: avoid');
    expect(PRINT_CSS).toContain('break-inside: avoid');
  });

  it('hides screen-only chrome but keeps the marking buttons legible', () => {
    expect(PRINT_CSS).toContain('.no-print');
    expect(PRINT_CSS).toContain('.print-sheet svg { display: none');
    expect(PRINT_CSS).toContain('print-color-adjust: exact');
  });

  it('clones the target element so a <table> keeps its wrapper', () => {
    const source = readFileSync(join(process.cwd(), 'lib', 'print.ts'), 'utf8');
    expect(source).toContain('dir="rtl"');
    expect(source).toContain('cloneNode(true)');
    expect(source).toContain("wrapper.className = 'print-sheet'");
  });
});
