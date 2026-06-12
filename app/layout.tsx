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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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