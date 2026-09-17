import type { Metadata } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'معين - العلوم الإسلامية | التعليم الثانوي بالجزائر',
  description: 'منصة وأداة رقمنة العمل التربوي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر: إدارة الأفواج، الحضور والغياب، التقويم والعلامات، النتائج والتحليل، الدفتر اليومي، جدول التوقيت، والبرامج التعليمية.',
  openGraph: {
    title: 'معين - العلوم الإسلامية | التعليم الثانوي بالجزائر',
    description: 'منصة وأداة رقمنة العمل التربوي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر.',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
