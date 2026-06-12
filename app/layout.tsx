import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/app/components/AuthProvider';
// import DisableInspect from './components/DisableInspect';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrimeSafety - Report & Track Crimes',
  description: 'AI-powered crime reporting and tracking platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: true,
    viewportFit: 'cover',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          {/* <DisableInspect /> */}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}