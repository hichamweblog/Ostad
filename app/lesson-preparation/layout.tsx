import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المذكرات',
  description: 'تحضير المذكرات والبطاقات التعليمية',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
