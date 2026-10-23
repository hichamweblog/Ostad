import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الإعدادات',
  description: 'إعدادات التطبيق والرزنامة والتقويم',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
