import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم',
  description: 'متابعة الحصص والأفواج والمهام اليومية',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
