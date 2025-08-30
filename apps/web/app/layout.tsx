'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { initAuth } from '../lib/auth';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    initAuth();
  }, []);
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={client}>
          <nav style={{ marginBottom: 16 }}>
            <Link href="/members">Members</Link> | <Link href="/terms">Terms</Link> | <Link href="/events">Events</Link> | <Link href="/audit">Audit</Link> | <Link href="/login">Login</Link>
          </nav>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
