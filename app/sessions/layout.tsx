import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'دفتر النصوص',
  description: 'سجل الحصص اليومي وملاحظات الدفتر',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
