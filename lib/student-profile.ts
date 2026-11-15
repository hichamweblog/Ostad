import {
  TRIMESTERS,
  filterByTrimester,
  normalizeTrimester,
  type Trimester,
} from './academic-calendar';
import {
  calculateEvaluationBreakdown,
  calculateStudentAverage,
  type ContinuousEvaluationBreakdown,
} from './grade-calculator';
import {
  collectNotebookChecks,
  normalizeNotebookRounds,
  notebookScoresFor,
} from './notebook-rounds';
import { getDefaultEstimation } from './pedagogical-evaluations';
import type { AppState } from './storage';
import type { ClassRoom, ContinuousEvaluationRules, Student, StudentGrade } from './types';

export interface StudentProfileTermStats {
  absent: number;
  late: number;
  excused: number;
  disruptions: number;
  goodParticipation: number;
  poorParticipation: number;
}

export interface StudentProfileTerm {
  trimester: Trimester;
  /** The grade's class preserves the term context when a student changed class. */
  classId: string;
  className: string | null;
  grade: StudentGrade | null;
  average: number | null;
  estimation: string;
  sessionsCount: number;
  documentedSessionsCount: number;
  stats: StudentProfileTermStats;
  evaluation: ContinuousEvaluationBreakdown;
}

export interface StudentProfileData {
  student: Student;
  classRoom: ClassRoom | null;
  activeTrimester: Trimester;
  evaluationRules?: ContinuousEvaluationRules;
  /** Current term first, followed by earlier terms in reverse chronological order. */
  terms: StudentProfileTerm[];
}

const emptyStats = (): StudentProfileTermStats => ({
  absent: 0,
  late: 0,
  excused: 0,
  disruptions: 0,
  goodParticipation: 0,
  poorParticipation: 0,
});

/**
 * Builds the read-only student profile from the same saved records used by the
 * gradebook and attendance screens. It never writes, infers missing marks, or
 * changes the active class/trimester.
 */
export function selectStudentProfile(
  state: AppState,
  studentId: string | null,
): StudentProfileData | null {
  if (!studentId) return null;
  const student = state.students.find(item => item.id === studentId);
  if (!student) return null;

  const activeTrimester = normalizeTrimester(state.activeTrimester);
  const evaluationRules = state.calendarSettings?.evaluationRules;
  const notebookRounds = normalizeNotebookRounds(evaluationRules?.notebookRounds);

  const terms = TRIMESTERS
    .filter(trimester => trimester <= activeTrimester)
    .reverse()
    .map((trimester): StudentProfileTerm => {
      const grade = state.grades.find(
        item => item.studentId === student.id && item.trimester === trimester,
      ) ?? null;
      const classId = grade?.classId || student.classId;
      const className = state.classes.find(item => item.id === classId)?.name ?? null;
      const sessions = filterByTrimester(
        state.sessions.filter(
          session => session.classId === classId && session.sessionStatus !== 'CANCELLED',
        ),
        state.calendarSettings?.termDates,
        trimester,
      );
      const stats = emptyStats();

      for (const session of sessions) {
        const attendance = session.attendance?.[student.id];
        if (attendance === 'ABSENT') stats.absent += 1;
        else if (attendance === 'LATE') stats.late += 1;
        else if (attendance === 'EXCUSED') stats.excused += 1;

        if (session.disruptions?.includes(student.id)) stats.disruptions += 1;
        if (session.goodParticipation?.includes(student.id)) stats.goodParticipation += 1;
        if (session.poorParticipation?.includes(student.id)) stats.poorParticipation += 1;
      }

      const documentedSessionsCount = sessions.filter(
        session => (session.goodParticipation?.length ?? 0) + (session.poorParticipation?.length ?? 0) > 0,
      ).length;
      const notebookScores = notebookScoresFor(
        collectNotebookChecks(sessions),
        student.id,
        notebookRounds,
      );
      const evaluation = calculateEvaluationBreakdown(
        {
          absent: stats.absent,
          late: stats.late,
          disruptions: stats.disruptions,
          poorPart: stats.poorParticipation,
          goodPart: stats.goodParticipation,
          sessionsCount: sessions.length,
          documentedSessions: documentedSessionsCount,
          notebookScores,
          participationJudgement: grade?.participationScore ?? null,
        },
        evaluationRules,
      );
      const calculatedAverage = grade?.calculatedAverage ?? calculateStudentAverage(
        grade?.continuousEval ?? null,
        grade?.quiz ?? null,
        grade?.exam ?? null,
      );
      const average = calculatedAverage !== null && Number.isFinite(calculatedAverage)
        ? calculatedAverage
        : null;

      return {
        trimester,
        classId,
        className,
        grade,
        average,
        estimation: grade?.estimation?.trim() || getDefaultEstimation(average),
        sessionsCount: sessions.length,
        documentedSessionsCount,
        stats,
        evaluation,
      };
    });

  return {
    student,
    classRoom: state.classes.find(item => item.id === student.classId) ?? null,
    activeTrimester,
    evaluationRules,
    terms,
  };
}
