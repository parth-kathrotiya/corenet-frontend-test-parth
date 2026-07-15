'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

const HIDDEN_NAVBAR_PATHS = ['/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowNavbar =
    !HIDDEN_NAVBAR_PATHS.includes(pathname) && !pathname.startsWith('/book/');

  return (
    <>
      {shouldShowNavbar ? <Navbar /> : null}
      {children}
    </>
  );
}
