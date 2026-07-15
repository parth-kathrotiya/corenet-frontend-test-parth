import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/redux/ReduxProvider';
import ToastContainer from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'BookSlot – Appointment Booking',
  description: 'Book appointments with your favourite service providers, effortlessly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased">
        <ReduxProvider>
          <ToastContainer />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
