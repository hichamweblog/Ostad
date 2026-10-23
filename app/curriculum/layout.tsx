import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المنهاج',
  description: 'منهاج العلوم الإسلامية المعتمد',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
