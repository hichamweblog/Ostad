import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'دفتر النقاط',
  description: 'التقويم المستمر والفروض والاختبارات',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
