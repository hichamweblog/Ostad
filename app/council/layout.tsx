import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'مجالس الأقسام',
  description: 'إحصائيات النتائج ونسب النجاح',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
