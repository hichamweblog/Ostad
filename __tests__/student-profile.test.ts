import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResponsiveOverlay } from '@/components/ResponsiveOverlay';
import { StudentProfileContent } from '@/components/StudentProfileOverlay';
import type { Trimester } from '@/lib/academic-calendar';
import { calculateCouncilStatistics } from '@/lib/grade-calculator';
import { selectStudentProfile } from '@/lib/student-profile';
import { getEmptyState, type AppState } from '@/lib/storage';
import type { ClassRoom, SessionRecord, Student, StudentGrade } from '@/lib/types';

const currentClass: ClassRoom = {
  id: 'class-current',
  name: '2 علوم 1',
  level: '2AS',
  stream: 'علوم تجريبية',
};
const previousClass: ClassRoom = {
  id: 'class-previous',
  name: '1 علوم 2',
  level: '1AS_SCIENCE',
  stream: 'جذع مشترك علوم',
};
const student: Student = {
  id: 'student-1',
  classId: currentClass.id,
  numberInList: 7,
  fullName: 'تلميذ اختبار',
  registrationNumber: '12345',
};

function session(partial: Partial<SessionRecord> & Pick<SessionRecord, 'id' | 'classId' | 'date'>): SessionRecord {
  return {
    startTime: '08:00',
    endTime: '09:00',
    sessionGoals: '',
    accomplishments: '',
    nextSteps: '',
    teacherNotes: '',
    attendance: {},
    ...partial,
  };
}

function grade(partial: Partial<StudentGrade> & Pick<StudentGrade, 'id' | 'classId' | 'trimester'>): StudentGrade {
  return {
    studentId: student.id,
    continuousEval: null,
    quiz: null,
    exam: null,
    ...partial,
  };
}

function makeState(activeTrimester: Trimester = 2): AppState {
  const empty = getEmptyState();
  return {
    ...empty,
    classes: [currentClass, previousClass],
    students: [student],
    activeClassId: currentClass.id,
    activeTrimester,
    sessions: [
      session({
        id: 'term-1',
        classId: previousClass.id,
        date: '2026-10-10',
        attendance: { [student.id]: 'ABSENT' },
        goodParticipation: [student.id],
        notebookChecks: {
          [student.id]: { round: 1, score: 6, at: '2026-10-10T08:30:00.000Z' },
        },
      }),
      session({
        id: 'cancelled-term-1',
        classId: previousClass.id,
        date: '2026-10-11',
        sessionStatus: 'CANCELLED',
        attendance: { [student.id]: 'ABSENT' },
        disruptions: [student.id],
        goodParticipation: [student.id],
        notebookChecks: {
          [student.id]: { round: 1, score: 0, at: '2026-10-11T08:30:00.000Z' },
        },
      }),
      session({
        id: 'term-2',
        classId: currentClass.id,
        date: '2027-01-10',
        attendance: { [student.id]: 'LATE' },
        disruptions: [student.id],
        goodParticipation: [student.id],
        notebookChecks: {
          [student.id]: { round: 1, score: 0, at: '2027-01-10T08:30:00.000Z' },
        },
      }),
      session({
        id: 'term-3',
        classId: currentClass.id,
        date: '2027-04-10',
        attendance: { [student.id]: 'ABSENT' },
      }),
    ],
    grades: [
      grade({
        id: 'grade-1',
        classId: previousClass.id,
        trimester: 1,
        continuousEval: 12,
        quiz: 10,
        exam: 14,
        participationScore: 2,
      }),
      grade({
        id: 'grade-2',
        classId: currentClass.id,
        trimester: 2,
        continuousEval: 0,
        quiz: 0,
        exam: 0,
        calculatedAverage: 0,
        participationScore: 4,
      }),
      grade({
        id: 'grade-3',
        classId: currentClass.id,
        trimester: 3,
        continuousEval: 20,
        quiz: 20,
        exam: 20,
        calculatedAverage: 20,
      }),
    ],
  };
}

describe('selectStudentProfile', () => {
  it('shows the current term first and preserves previous-term class and grades', () => {
    const profile = selectStudentProfile(makeState(2), student.id);

    expect(profile?.terms.map(term => term.trimester)).toEqual([2, 1]);
    expect(profile?.terms[0].average).toBe(0);
    expect(profile?.terms[1].average).toBe(12.5);
    expect(profile?.terms[1].classId).toBe(previousClass.id);
    expect(profile?.terms[1].className).toBe(previousClass.name);
  });

  it('keeps a recorded zero and distinguishes it from missing evidence', () => {
    const profile = selectStudentProfile(makeState(2), student.id);
    const current = profile?.terms[0];

    expect(current?.grade?.continuousEval).toBe(0);
    expect(current?.average).toBe(0);
    expect(current?.evaluation.notebook).toBe(0);
    expect(current?.evaluation.participationJudgement).toBe(4);
  });

  it('counts lateness for follow-up without deducting attendance', () => {
    const current = selectStudentProfile(makeState(2), student.id)?.terms[0];

    expect(current?.stats.late).toBe(1);
    expect(current?.stats.absent).toBe(0);
    expect(current?.evaluation.attendance).toBe(3);
  });

  it('excludes cancelled sessions and sessions from later terms', () => {
    const profile = selectStudentProfile(makeState(2), student.id);
    const previous = profile?.terms[1];

    expect(previous?.sessionsCount).toBe(1);
    expect(previous?.stats.absent).toBe(1);
    expect(previous?.stats.disruptions).toBe(0);
    expect(previous?.stats.goodParticipation).toBe(1);
    expect(previous?.evaluation.notebook).toBe(6);
    expect(previous?.evaluation.participation).toBe(6);
    expect(profile?.terms[0].stats.absent).toBe(0);
  });

  it('shows only term 1 in term 1 and all three terms in term 3', () => {
    expect(selectStudentProfile(makeState(1), student.id)?.terms.map(term => term.trimester)).toEqual([1]);
    expect(selectStudentProfile(makeState(3), student.id)?.terms.map(term => term.trimester)).toEqual([3, 2, 1]);
  });

  it('does not turn missing marks, notebook evidence, or participation into zero', () => {
    const state = makeState(2);
    state.grades = [];
    state.sessions = [];
    const current = selectStudentProfile(state, student.id)?.terms[0];

    expect(current?.average).toBeNull();
    expect(current?.grade).toBeNull();
    expect(current?.evaluation.notebook).toBeNull();
    expect(current?.evaluation.participation).toBeNull();
    expect(current?.sessionsCount).toBe(0);
  });

  it('returns null for an unknown student and does not mutate state', () => {
    const state = makeState(2);
    const snapshot = structuredClone(state);

    expect(selectStudentProfile(state, 'missing')).toBeNull();
    expect(selectStudentProfile(state, null)).toBeNull();
    expect(selectStudentProfile(state, student.id)).not.toBeNull();
    expect(state).toEqual(snapshot);
  });
});

describe('council student profile links', () => {
  it('uses stable ids even when two students share the same name', () => {
    const state = makeState(2);
    const otherStudent: Student = { ...student, id: 'student-2', numberInList: 8 };
    state.students = [student, otherStudent];
    state.grades = [
      grade({
        id: 'council-grade-1',
        classId: currentClass.id,
        trimester: 2,
        continuousEval: 10,
        quiz: 10,
        exam: 10,
        calculatedAverage: 10,
      }),
      grade({
        id: 'council-grade-2',
        studentId: otherStudent.id,
        classId: currentClass.id,
        trimester: 2,
        continuousEval: 12,
        quiz: 12,
        exam: 12,
        calculatedAverage: 12,
      }),
    ];

    const stats = calculateCouncilStatistics(
      currentClass.id,
      2,
      state.students,
      state.grades,
    );

    expect(stats.topStudentId).toBe(otherStudent.id);
    expect(stats.lowestStudentId).toBe(student.id);
    expect(stats.topStudentName).toBe(stats.lowestStudentName);

    const emptyStats = calculateCouncilStatistics(currentClass.id, 2, state.students, []);
    expect(emptyStats.topStudentId).toBeNull();
    expect(emptyStats.lowestStudentId).toBeNull();
  });
});

describe('StudentProfileContent', () => {
  it('renders current and previous terms without later-term results or a lateness card', () => {
    const profile = selectStudentProfile(makeState(2), student.id);
    expect(profile).not.toBeNull();

    const html = renderToStaticMarkup(
      React.createElement(StudentProfileContent, { profile: profile! }),
    );

    expect(html).toContain('الفصل الثاني');
    expect(html).toContain('الفصل الأول');
    expect(html).not.toContain('الفصل الثالث');
    expect(html).not.toContain('التأخر');
    expect(html).not.toContain('للمتابعة فقط');
    expect(html).toContain('12345');
  });

  it('labels terms without saved marks instead of presenting them as zero', () => {
    const state = makeState(2);
    state.grades = [];
    state.sessions = [];
    const profile = selectStudentProfile(state, student.id);
    const html = renderToStaticMarkup(
      React.createElement(StudentProfileContent, { profile: profile! }),
    );

    expect(html).toContain('لا توجد نقاط مسجلة');
    expect(html).toContain('لا حصص محفوظة');
    expect(html).toContain('—');
  });

  it('renders all 4 marks in order and equal-sized follow-up cards inside term 1 summary while keeping section order', () => {
    const profile = selectStudentProfile(makeState(1), student.id);
    expect(profile).not.toBeNull();

    const html = renderToStaticMarkup(
      React.createElement(StudentProfileContent, { profile: profile! }),
    );

    const summaryStart = html.indexOf('ملخص الفصل الأول');
    const indicatorsStart = html.indexOf('مؤشرات التقويم المستمر');
    const resultsStart = html.indexOf('النتائج الفصلية');

    expect(summaryStart).toBeGreaterThan(-1);
    expect(indicatorsStart).toBeGreaterThan(summaryStart);
    expect(resultsStart).toBeGreaterThan(indicatorsStart);

    const summaryHtml = html.slice(summaryStart, indicatorsStart);
    const evalIdx = summaryHtml.indexOf('>التقويم<');
    const quizIdx = summaryHtml.indexOf('>الفرض<');
    const examIdx = summaryHtml.indexOf('>الاختبار<');
    const avgIdx = summaryHtml.indexOf('>المعدل<');

    expect(evalIdx).toBeGreaterThan(-1);
    expect(quizIdx).toBeGreaterThan(evalIdx);
    expect(examIdx).toBeGreaterThan(quizIdx);
    expect(avgIdx).toBeGreaterThan(examIdx);

    const absencesIdx = summaryHtml.indexOf('>الغيابات<');
    const goodPartIdx = summaryHtml.indexOf('>المشاركات الإيجابية<');
    const disruptionsIdx = summaryHtml.indexOf('>المخالفات السلوكية<');

    expect(absencesIdx).toBeGreaterThan(avgIdx);
    expect(goodPartIdx).toBeGreaterThan(absencesIdx);
    expect(disruptionsIdx).toBeGreaterThan(goodPartIdx);
    expect(summaryHtml).toContain('grid-cols-3');

    const indicatorsHtml = html.slice(indicatorsStart, resultsStart);
    const bIdx = indicatorsHtml.indexOf('السلوك والانضباط');
    const aIdx = indicatorsHtml.indexOf('المواظبة والحضور');
    const nIdx = indicatorsHtml.indexOf('الكراس وأدوات التعلم');
    const pIdx = indicatorsHtml.indexOf('المشاركة الصفية');

    expect(bIdx).toBeGreaterThan(-1);
    expect(aIdx).toBeGreaterThan(bIdx);
    expect(nIdx).toBeGreaterThan(aIdx);
    expect(pIdx).toBeGreaterThan(nIdx);
  });

  it('keeps the requested wider desktop overlay instead of the default width', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ResponsiveOverlay,
        {
          open: true,
          title: 'ملف التلميذ',
          overlayId: 'profile-test',
          onClose: () => undefined,
          className: 'sm:max-w-3xl',
        },
        React.createElement('div', null, 'المحتوى'),
      ),
    );

    expect(html).toContain('sm:max-w-3xl');
    expect(html).not.toContain('sm:max-w-lg');
  });
});
