import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الحضور والتقويم المستمر',
  description: 'رصد الحضور والسلوك والمواظبة',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
