'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/media?tab=video');
  }, [router]);

  return null;
}
