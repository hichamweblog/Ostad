import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الأقسام المسندة',
  description: 'إدارة الأقسام والحصص الأسبوعية',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
