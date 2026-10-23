import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'قوائم التلاميذ',
  description: 'إدارة قوائم التلاميذ واستيرادها',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
