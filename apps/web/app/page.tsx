"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAccessToken } from '../lib/api';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
    }
  }, [router]);
  return <div>Dashboard</div>;
}
