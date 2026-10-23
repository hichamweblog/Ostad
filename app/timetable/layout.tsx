import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'جدول التوقيت',
  description: 'شبكة الحصص الأسبوعية',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
