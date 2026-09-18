import { CurriculumUnit, GradeLevel } from './types';
import { enrichUnitsWithDriveData } from './drive-curriculum-map';

export const OFFICIAL_LEVELS: {
  id: GradeLevel;
  name: string;
  subtitle: string;
  hoursTotal: number;
  unitsCount: number;
  weeklyHours: number;
}[] = [
  {
    id: '1AS_ARTS',
    name: 'السنة الأولى ثانوي — جذع مشترك آداب',
    subtitle: 'المنهاج والتدرج السنوي المعتمد (24 وحدة — 54 ساعة — ساعتان أسبوعياً)',
    hoursTotal: 54,
    unitsCount: 24,
    weeklyHours: 2
  },
  {
    id: '1AS_SCIENCE',
    name: 'السنة الأولى ثانوي — جذع مشترك علوم وتكنولوجيا',
    subtitle: 'المنهاج والتدرج السنوي المعتمد (15 وحدة — 27 ساعة — ساعة واحدة أسبوعياً)',
    hoursTotal: 27,
    unitsCount: 15,
    weeklyHours: 1
  },
  {
    id: '2AS',
    name: 'السنة الثانية ثانوي — جميع الشعب',
    subtitle: 'التوزيع السنوي والتدرج الرسمي (23 وحدة — 54 ساعة — ساعتان أسبوعياً)',
    hoursTotal: 54,
    unitsCount: 23,
    weeklyHours: 2
  },
  {
    id: '3AS',
    name: 'السنة الثالثة ثانوي (بكالوريا) — جميع الشعب',
    subtitle: 'التدرج السنوي الرسمي والتحضير للبكالوريا (24 وحدة — 54 ساعة — ساعتان أسبوعياً)',
    hoursTotal: 54,
    unitsCount: 24,
    weeklyHours: 2
  }
];

export function getWeeklyHours(level: GradeLevel): number {
  return level === '1AS_SCIENCE' ? 1 : 2;
}

