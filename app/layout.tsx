import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles
import { Amiri, Tajawal } from 'next/font/google';
import ToastContainer from '@/components/Toast';

const amiri = Amiri({ 
  subsets: ['arabic'], 
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap'
});

const tajawal = Tajawal({ 
  subsets: ['arabic'], 
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'معين - العلوم الإسلامية | التعليم الثانوي بالجزائر',
  description: 'منصة وأداة رقمنة العمل التربوي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر: إدارة الأفواج، الحضور والغياب، التقويم والعلامات، النتائج والتحليل، الدفتر اليومي، جدول التوقيت، والبرامج التعليمية.',
  openGraph: {
    title: 'معين - العلوم الإسلامية | التعليم الثانوي بالجزائر',
    description: 'منصة وأداة رقمنة العمل التربوي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${amiri.variable} ${tajawal.variable}`} suppressHydrationWarning>
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
