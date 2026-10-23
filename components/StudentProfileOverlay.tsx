'use client';

import { CalendarDays, MessageSquareText, UserRound } from 'lucide-react';
import { useAppState } from '@/hooks/app-state-context';
import { trimesterLabel } from '@/lib/academic-calendar';
import { criterionLabel, criterionMax, EVALUATION_CRITERIA } from '@/lib/evaluation-labels';
import {
  selectStudentProfile,
  type StudentProfileData,
  type StudentProfileTerm,
} from '@/lib/student-profile';
import { ResponsiveOverlay } from './ResponsiveOverlay';

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return String(Math.round(value * 100) / 100);
}

function SummaryCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3">
      <div className="text-xs font-bold text-[var(--text-secondary)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1 font-mono text-xl font-black text-[var(--text-primary)]" dir="ltr">
        <span>{value}</span>
        {unit && <span className="text-xs font-bold text-[var(--text-tertiary)]">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">{hint}</div>}
    </div>
  );
}

function TermLabel({ profile, term }: { profile: StudentProfileData; term: StudentProfileTerm }) {
  const isCurrent = term.trimester === profile.activeTrimester;
  const changedClass = term.className && term.className !== profile.classRoom?.name;
  const hasSavedMarks = [
    term.grade?.continuousEval,
    term.grade?.quiz,
    term.grade?.exam,
  ].some(value => value !== null && value !== undefined);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span>{trimesterLabel(term.trimester)}</span>
        {isCurrent && (
          <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-ink)]">
            الحالي
          </span>
        )}
      </div>
      {changedClass && <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">{term.className}</div>}
      {!hasSavedMarks && <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">لا توجد نقاط مسجلة</div>}
    </div>
  );
}

function TermGradesCards({ profile }: { profile: StudentProfileData }) {
  return (
    <div className="space-y-2 md:hidden">
      {profile.terms.map(term => (
        <article
          key={term.trimester}
          className={`rounded-xl border p-3 ${term.trimester === profile.activeTrimester ? 'border-[var(--primary)]/25 bg-[var(--primary-soft)]/40' : 'border-[var(--border-subtle)] bg-white'}`}
        >
          <div className="text-xs font-black text-[var(--text-primary)]">
            <TermLabel profile={profile} term={term} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {([
              ['التقويم', term.grade?.continuousEval],
              ['الفرض', term.grade?.quiz],
              ['الاختبار', term.grade?.exam],
              ['المعدل', term.average],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-2">
                <dt className="font-semibold text-[var(--text-secondary)]">{label}</dt>
                <dd className="font-mono font-black text-[var(--text-primary)]" dir="ltr">{formatScore(value)}</dd>
              </div>
            ))}
          </dl>
          {term.estimation && <div className="mt-2 text-xs font-bold text-[var(--text-secondary)]">{term.estimation}</div>}
        </article>
      ))}
    </div>
  );
}

function TermGradesTable({ profile }: { profile: StudentProfileData }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--border-subtle)] md:block">
      <table className="w-full text-right text-xs">
        <caption className="sr-only">نتائج الفصل الحالي والفصول السابقة</caption>
        <thead className="bg-[var(--bg-page)] font-bold text-[var(--text-secondary)]">
          <tr>
            <th className="px-3 py-2.5">الفصل</th>
            <th className="px-3 py-2.5 text-center">التقويم</th>
            <th className="px-3 py-2.5 text-center">الفرض</th>
            <th className="px-3 py-2.5 text-center">الاختبار</th>
            <th className="px-3 py-2.5 text-center">المعدل</th>
            <th className="px-3 py-2.5">التقدير</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {profile.terms.map(term => (
            <tr key={term.trimester} className={term.trimester === profile.activeTrimester ? 'bg-[var(--primary-soft)]/35' : 'bg-white'}>
              <th scope="row" className="px-3 py-3 font-black text-[var(--text-primary)]">
                <TermLabel profile={profile} term={term} />
              </th>
              {([
                term.grade?.continuousEval,
                term.grade?.quiz,
                term.grade?.exam,
                term.average,
              ] as const).map((value, index) => (
                <td key={index} className={`px-3 py-3 text-center font-mono ${index === 3 ? 'font-black text-[var(--primary-ink)]' : 'font-bold text-[var(--text-primary)]'}`} dir="ltr">
                  {formatScore(value)}
                </td>
              ))}
              <td className="px-3 py-3 font-semibold text-[var(--text-secondary)]">{term.estimation || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StudentProfileContent({ profile }: { profile: StudentProfileData }) {
  const current = profile.terms[0];
  if (!current) return null;
  const { student, classRoom } = profile;
  const registrationNumber = student.registrationNumber || student.regNumber;
  const notes = [
    { label: 'الإرشادات', value: current.grade?.guidance?.trim() },
    { label: 'ملاحظة', value: current.grade?.remarks?.trim() },
    { label: 'متابعة محفوظة', value: current.grade?.followUpNotes?.trim() },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary-ink)]">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="break-words text-lg font-black text-[var(--text-primary)]">{student.fullName}</h3>
          <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
            {classRoom?.name || 'قسم غير محدد'}{classRoom?.stream ? ` · ${classRoom.stream}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-[var(--text-tertiary)]">
            <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1">الرقم: {student.numberInList}</span>
            {registrationNumber && <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1 font-mono">التسجيل: {registrationNumber}</span>}
          </div>
        </div>
      </div>

      <section aria-labelledby="student-current-summary">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          <h3 id="student-current-summary" className="text-sm font-black text-[var(--text-primary)]">
            ملخص {trimesterLabel(profile.activeTrimester)}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryCard label="المعدل" value={formatScore(current.average)} unit="/ 20" />
          <SummaryCard label="التقويم المستمر" value={formatScore(current.grade?.continuousEval)} unit="/ 20" />
          <SummaryCard
            label="الغيابات"
            value={current.sessionsCount > 0 ? String(current.stats.absent) : '—'}
            hint={current.sessionsCount > 0 ? `من ${current.sessionsCount} حصة` : 'لا حصص محفوظة'}
          />
          <SummaryCard
            label="التأخر"
            value={current.sessionsCount > 0 ? String(current.stats.late) : '—'}
            hint="للمتابعة فقط"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[var(--text-secondary)]">
          <span className="rounded-lg bg-[var(--bg-page)] px-2.5 py-1.5">
            مشاركة إيجابية: {current.documentedSessionsCount > 0 ? current.stats.goodParticipation : '—'}
          </span>
          <span className="rounded-lg bg-[var(--bg-page)] px-2.5 py-1.5">
            مخالفات سلوكية: {current.sessionsCount > 0 ? current.stats.disruptions : '—'}
          </span>
        </div>
      </section>

      <section aria-labelledby="student-evaluation-breakdown">
        <h3 id="student-evaluation-breakdown" className="mb-3 text-sm font-black text-[var(--text-primary)]">
          مؤشرات التقويم المستمر
        </h3>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {EVALUATION_CRITERIA.map(meta => {
            const value = current.evaluation[meta.key];
            const participationDetails = meta.key === 'participation'
              ? [
                  current.evaluation.participationRecorded !== null ? `توثيق ${formatScore(current.evaluation.participationRecorded)}` : null,
                  current.evaluation.participationJudgement !== null ? `تقدير ${formatScore(current.evaluation.participationJudgement)}` : null,
                ].filter(Boolean).join(' · ')
              : '';
            return (
              <div key={meta.key} className="rounded-xl border border-[var(--border-subtle)] bg-white p-3">
                <div className="text-xs font-bold text-[var(--text-secondary)]">{criterionLabel(meta.key)}</div>
                <div className="mt-1 font-mono text-lg font-black text-[var(--text-primary)]" dir="ltr">
                  {formatScore(value)} / {criterionMax(profile.evaluationRules, meta.key)}
                </div>
                {participationDetails && <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">{participationDetails}</div>}
                {value === null && <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">لا توجد بيانات</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="student-term-results">
        <h3 id="student-term-results" className="mb-3 text-sm font-black text-[var(--text-primary)]">
          النتائج الفصلية
        </h3>
        <TermGradesCards profile={profile} />
        <TermGradesTable profile={profile} />
      </section>

      {notes.length > 0 && (
        <section aria-labelledby="student-saved-notes" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
            <h3 id="student-saved-notes" className="text-xs font-black text-[var(--text-primary)]">ملاحظات الفصل الحالي</h3>
          </div>
          <dl className="space-y-2">
            {notes.map(item => (
              <div key={item.label}>
                <dt className="text-[11px] font-bold text-[var(--text-tertiary)]">{item.label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap break-words text-xs font-semibold leading-6 text-[var(--text-secondary)]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

interface StudentProfileOverlayProps {
  studentId: string | null;
  onClose: () => void;
}

export function StudentProfileOverlay({ studentId, onClose }: StudentProfileOverlayProps) {
  const { state } = useAppState();
  const profile = selectStudentProfile(state, studentId);

  return (
    <ResponsiveOverlay
      open={Boolean(studentId)}
      title="ملف التلميذ"
      overlayId="student-profile"
      onClose={onClose}
      className="sm:max-w-3xl"
    >
      {profile ? (
        <StudentProfileContent profile={profile} />
      ) : (
        <div className="p-6 text-center text-xs font-semibold text-[var(--text-secondary)]">
          تعذر العثور على بيانات التلميذ.
        </div>
      )}
    </ResponsiveOverlay>
  );
}
