import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'التوزيع السنوي',
  description: 'التدرج السنوي للتعلمات',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
