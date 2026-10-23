'use client';

import type { Student } from '@/lib/types';

interface StudentNameButtonProps {
  student: Pick<Student, 'id' | 'fullName'>;
  onOpen: (studentId: string) => void;
  className?: string;
  truncate?: boolean;
}

/** A dedicated name action that does not turn the whole editable row into a link. */
export function StudentNameButton({
  student,
  onOpen,
  className = '',
  truncate = true,
}: StudentNameButtonProps) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onOpen(student.id);
      }}
      aria-label={`فتح ملف ${student.fullName}`}
      title="فتح ملف التلميذ"
      className={`inline-flex min-h-11 min-w-0 max-w-full items-center rounded-md px-1 text-right font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${className}`}
    >
      <span className={truncate ? 'truncate' : 'break-words'}>{student.fullName}</span>
    </button>
  );
}
