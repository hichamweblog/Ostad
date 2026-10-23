import { describe, expect, it } from 'vitest';
import { nextGradeCell, parseGradeTable } from '@/lib/grade-table';

describe('parseGradeTable', () => {
  it('reads a tab separated sheet copied from Excel', () => {
    const result = parseGradeTable('بن علي يوسف\t12\t14.5\t16\nحداد مريم\t9\t8\t11');

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      name: 'بن علي يوسف',
      values: { continuousEval: '12', quiz: '14.5', exam: '16' },
    });
    expect(result.skipped).toEqual([]);
  });

  it('drops the header line and accepts Arabic-Indic digits', () => {
    const result = parseGradeTable('الاسم\tالتقويم المستمر\tالفرض\tالاختبار\nزروقي أمينة\t١٥\t١٢\t١٨');

    expect(result.headerSkipped).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].values).toEqual({ continuousEval: '15', quiz: '12', exam: '18' });
  });

  it('places a single value in the fallback column', () => {
    const result = parseGradeTable('بلقاسم سارة,17', 'exam');

    expect(result.rows[0].values).toEqual({ exam: '17' });
  });

  it('reports out-of-range and empty rows instead of importing them', () => {
    const result = parseGradeTable('عمراني طارق\t25\n\nخالد\t');

    expect(result.rows).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped[0].reason).toContain('نقطة غير صالحة');
  });

  it('ignores the Arabic decimal comma', () => {
    const result = parseGradeTable('سعيد\t13,75\t10\t12');

    expect(result.rows[0].values.continuousEval).toBe('13.75');
  });
});

describe('nextGradeCell', () => {
  it('keeps the column and moves to the next student on Enter/Down', () => {
    expect(nextGradeCell('quiz', 'down')).toEqual({ field: 'quiz', moveRow: 1 });
    expect(nextGradeCell('quiz', 'up')).toEqual({ field: 'quiz', moveRow: -1 });
  });

  it('moves across columns in RTL reading order', () => {
    expect(nextGradeCell('continuousEval', 'left')).toEqual({ field: 'quiz', moveRow: 0 });
    expect(nextGradeCell('quiz', 'right')).toEqual({ field: 'continuousEval', moveRow: 0 });
  });

  it('stops at the column edges', () => {
    expect(nextGradeCell('continuousEval', 'right')).toBeNull();
    expect(nextGradeCell('exam', 'left')).toBeNull();
  });
});
