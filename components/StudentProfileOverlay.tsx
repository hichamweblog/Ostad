'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  GraduationCap,
  MessageSquareText,
  Sparkles,
  UserRound,
  UserX,
} from 'lucide-react';
import { useAppState } from '@/hooks/app-state-context';
import { trimesterLabel } from '@/lib/academic-calendar';
import { criterionLabel, criterionMax, EVALUATION_CRITERIA } from '@/lib/evaluation-labels';
import { getScoreTier, PEDAGOGICAL_TIERS } from '@/lib/pedagogical-evaluations';
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

function formatSessionsGenitive(count: number, adjective?: 'documented'): string {
  if (count === 1) return adjective ? 'حصة موثقة واحدة' : 'حصة واحدة';
  if (count === 2) return adjective ? 'حصتين موثقتين' : 'حصتين';
  if (count >= 3 && count <= 10) return adjective ? `${count} حصص موثقة` : `${count} حصص`;
  return adjective ? `${count} حصة موثقة` : `${count} حصة`;
}

type CardTone = 'default' | 'primary' | 'warning' | 'success' | 'danger';

const TONE_ICON_STYLES: Record<CardTone, string> = {
  default: 'bg-[var(--bg-surface)] text-[var(--text-secondary)]',
  primary: 'bg-white/80 text-[var(--primary-ink)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
};

function SummaryCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'default',
  highlighted = false,
  className = '',
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: CardTone;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border p-2.5 sm:p-3.5 ${
        highlighted
          ? 'border-[var(--primary)]/30 bg-[var(--primary-soft)]/55'
          : 'border-[var(--border-subtle)] bg-[var(--bg-page)]'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span
          className={`text-xs font-bold leading-snug ${
            highlighted ? 'text-[var(--primary-ink)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          {label}
        </span>
        {icon && (
          <span
            className={`hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:inline-flex ${TONE_ICON_STYLES[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2">
        <div
          className={`flex items-baseline gap-1 font-mono text-xl font-black tabular-nums sm:text-2xl ${
            highlighted ? 'text-[var(--primary-ink)]' : 'text-[var(--text-primary)]'
          }`}
          dir="ltr"
        >
          <span>{value}</span>
          {unit && <span className="text-xs font-bold text-[var(--text-tertiary)]">{unit}</span>}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] font-semibold leading-tight text-[var(--text-tertiary)]">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  icon,
}: {
  id: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary-ink)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 id={id} className="text-sm font-black text-[var(--text-primary)]">
        {title}
      </h3>
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
      {changedClass && (
        <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">{term.className}</div>
      )}
      {!hasSavedMarks && (
        <div className="mt-1 text-[11px] font-semibold text-[var(--text-tertiary)]">
          لا توجد نقاط مسجلة
        </div>
      )}
    </div>
  );
}

function TermGradesCards({ profile }: { profile: StudentProfileData }) {
  return (
    <div className="space-y-2.5 md:hidden">
      {profile.terms.map(term => {
        const tierClass = PEDAGOGICAL_TIERS[getScoreTier(term.average)].colorClass;
        return (
          <article
            key={term.trimester}
            className={`rounded-xl border p-3.5 ${
              term.trimester === profile.activeTrimester
                ? 'border-[var(--primary)]/25 bg-[var(--primary-soft)]/35'
                : 'border-[var(--border-subtle)] bg-[var(--bg-page)]/55'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-black text-[var(--text-primary)]">
                <TermLabel profile={profile} term={term} />
              </div>
              {term.estimation && (
                <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${tierClass}`}>
                  {term.estimation}
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ['التقويم', term.grade?.continuousEval, false],
                  ['الفرض', term.grade?.quiz, false],
                  ['الاختبار', term.grade?.exam, false],
                  ['المعدل', term.average, true],
                ] as const
              ).map(([label, value, isAverage]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${
                    isAverage
                      ? 'border-[var(--primary)]/25 bg-white font-black text-[var(--primary-ink)]'
                      : 'border-[var(--border-subtle)] bg-white'
                  }`}
                >
                  <dt className={isAverage ? 'font-bold text-[var(--primary-ink)]' : 'font-semibold text-[var(--text-secondary)]'}>
                    {label}
                  </dt>
                  <dd
                    className={`font-mono font-black tabular-nums ${
                      isAverage ? 'text-[var(--primary-ink)]' : 'text-[var(--text-primary)]'
                    }`}
                    dir="ltr"
                  >
                    {formatScore(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function TermGradesTable({ profile }: { profile: StudentProfileData }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] md:block">
      <table className="w-full text-right text-xs">
        <caption className="sr-only">نتائج الفصل الحالي والفصول السابقة</caption>
        <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] font-bold text-[var(--text-secondary)]">
          <tr>
            <th className="px-3.5 py-3">الفصل</th>
            <th className="px-3.5 py-3 text-center">التقويم</th>
            <th className="px-3.5 py-3 text-center">الفرض</th>
            <th className="px-3.5 py-3 text-center">الاختبار</th>
            <th className="px-3.5 py-3 text-center">المعدل</th>
            <th className="px-3.5 py-3">التقدير</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {profile.terms.map(term => {
            const tierClass = PEDAGOGICAL_TIERS[getScoreTier(term.average)].colorClass;
            return (
              <tr
                key={term.trimester}
                className={
                  term.trimester === profile.activeTrimester
                    ? 'bg-[var(--primary-soft)]/35'
                    : 'bg-[var(--bg-surface)]'
                }
              >
                <th scope="row" className="px-3.5 py-3 font-black text-[var(--text-primary)]">
                  <TermLabel profile={profile} term={term} />
                </th>
                {(
                  [
                    term.grade?.continuousEval,
                    term.grade?.quiz,
                    term.grade?.exam,
                    term.average,
                  ] as const
                ).map((value, index) => (
                  <td
                    key={index}
                    className={`px-3.5 py-3 text-center font-mono tabular-nums ${
                      index === 3
                        ? 'text-sm font-black text-[var(--primary-ink)]'
                        : 'font-bold text-[var(--text-primary)]'
                    }`}
                    dir="ltr"
                  >
                    {formatScore(value)}
                  </td>
                ))}
                <td className="px-3.5 py-3">
                  {term.estimation ? (
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold ${tierClass}`}>
                      {term.estimation}
                    </span>
                  ) : (
                    <span className="font-semibold text-[var(--text-tertiary)]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
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
  const currentTierClass = PEDAGOGICAL_TIERS[getScoreTier(current.average)].colorClass;
  const notes = [
    { label: 'الإرشادات', value: current.grade?.guidance?.trim() },
    { label: 'ملاحظة', value: current.grade?.remarks?.trim() },
    { label: 'متابعة محفوظة', value: current.grade?.followUpNotes?.trim() },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <div className="space-y-4 bg-[var(--bg-page)]/65 p-4 sm:p-5">
      {/* هوية التلميذ */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary-soft)] text-[var(--primary-ink)] sm:h-14 sm:w-14">
              <UserRound className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-lg font-black leading-snug text-[var(--text-primary)] sm:text-xl">
                {student.fullName}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>
                  {classRoom?.name || 'قسم غير محدد'}
                  {classRoom?.stream ? ` · ${classRoom.stream}` : ''}
                </span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 py-1">
                  <span>الرقم:</span>
                  <span className="font-mono font-black text-[var(--text-primary)]" dir="ltr">
                    {student.numberInList}
                  </span>
                </span>
                {registrationNumber && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 py-1">
                    <span>التسجيل:</span>
                    <span className="font-mono font-black text-[var(--text-primary)]" dir="ltr">
                      {registrationNumber}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {current.estimation && (
            <span
              className={`inline-flex self-start items-center rounded-xl px-3 py-1.5 text-xs font-black sm:self-center ${currentTierClass}`}
            >
              {current.estimation}
            </span>
          )}
        </div>
      </div>

      {/* 1. ملخص الفصل الحالي */}
      <section
        aria-labelledby="student-current-summary"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <SectionHeading
          id="student-current-summary"
          title={`ملخص ${trimesterLabel(profile.activeTrimester)}`}
          icon={<CalendarDays className="h-4 w-4" />}
        />

        {/* سائر النقاط بالترتيب: التقويم | الفرض | الاختبار | المعدل */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <SummaryCard
            label="التقويم"
            value={formatScore(current.grade?.continuousEval)}
            unit="/ 20"
          />
          <SummaryCard
            label="الفرض"
            value={formatScore(current.grade?.quiz)}
            unit="/ 20"
          />
          <SummaryCard
            label="الاختبار"
            value={formatScore(current.grade?.exam)}
            unit="/ 20"
          />
          <SummaryCard
            label="المعدل"
            value={formatScore(current.average)}
            unit="/ 20"
            highlighted
          />
        </div>

        {/* الغيابات والمشاركات الإيجابية والمخالفات السلوكية بنفس الحجم */}
        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:gap-2.5">
          <SummaryCard
            label="الغيابات"
            value={current.sessionsCount > 0 ? String(current.stats.absent) : '—'}
            hint={
              current.sessionsCount > 0
                ? `من ${formatSessionsGenitive(current.sessionsCount)}`
                : 'لا حصص محفوظة'
            }
            icon={<UserX className="h-3.5 w-3.5" />}
            tone="warning"
          />
          <SummaryCard
            label="المشاركات الإيجابية"
            value={
              current.documentedSessionsCount > 0 ? String(current.stats.goodParticipation) : '—'
            }
            hint={
              current.documentedSessionsCount > 0
                ? `في ${formatSessionsGenitive(current.documentedSessionsCount, 'documented')}`
                : 'لا حصص موثقة'
            }
            icon={<Sparkles className="h-3.5 w-3.5" />}
            tone="success"
          />
          <SummaryCard
            label="المخالفات السلوكية"
            value={current.sessionsCount > 0 ? String(current.stats.disruptions) : '—'}
            hint={
              current.sessionsCount > 0
                ? `من ${formatSessionsGenitive(current.sessionsCount)}`
                : 'لا حصص محفوظة'
            }
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            tone="danger"
          />
        </div>
      </section>

      {/* 2. مؤشرات التقويم المستمر */}
      <section
        aria-labelledby="student-evaluation-breakdown"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <SectionHeading
          id="student-evaluation-breakdown"
          title="مؤشرات التقويم المستمر"
          icon={<Award className="h-4 w-4" />}
        />

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {EVALUATION_CRITERIA.map(meta => {
            const value = current.evaluation[meta.key];
            const max = criterionMax(profile.evaluationRules, meta.key);
            const ratio =
              value !== null && max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
            const participationDetails =
              meta.key === 'participation'
                ? [
                    current.evaluation.participationRecorded !== null
                      ? `توثيق ${formatScore(current.evaluation.participationRecorded)}`
                      : null,
                    current.evaluation.participationJudgement !== null
                      ? `تقدير ${formatScore(current.evaluation.participationJudgement)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : '';

            return (
              <div
                key={meta.key}
                className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)]/60 p-3 sm:p-3.5"
              >
                <div>
                  <div className="text-xs font-bold text-[var(--text-secondary)]">
                    {criterionLabel(meta.key)}
                  </div>
                  <div
                    className="mt-2 flex items-baseline gap-1 font-mono text-lg font-black tabular-nums text-[var(--text-primary)] sm:text-xl"
                    dir="ltr"
                  >
                    <span>{formatScore(value)}</span>
                    <span className="text-xs font-bold text-[var(--text-tertiary)]">/ {max}</span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  {participationDetails && (
                    <div className="mt-1.5 text-[11px] font-semibold text-[var(--text-tertiary)]">
                      {participationDetails}
                    </div>
                  )}
                  {value === null && (
                    <div className="mt-1.5 text-[11px] font-semibold text-[var(--text-tertiary)]">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. النتائج الفصلية */}
      <section
        aria-labelledby="student-term-results"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <SectionHeading
          id="student-term-results"
          title="النتائج الفصلية"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <TermGradesCards profile={profile} />
        <TermGradesTable profile={profile} />
      </section>

      {/* ملاحظات الفصل الحالي المحفوظة */}
      {notes.length > 0 && (
        <section
          aria-labelledby="student-saved-notes"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <SectionHeading
            id="student-saved-notes"
            title="ملاحظات الفصل الحالي"
            icon={<MessageSquareText className="h-4 w-4" />}
          />
          <dl className="space-y-2.5">
            {notes.map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3.5 py-2.5"
              >
                <dt className="text-[11px] font-bold text-[var(--text-tertiary)]">{item.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-xs font-semibold leading-6 text-[var(--text-secondary)]">
                  {item.value}
                </dd>
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
