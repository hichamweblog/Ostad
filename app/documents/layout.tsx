import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الوثائق',
  description: 'تصدير الوثائق والتقارير الرسمية',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
