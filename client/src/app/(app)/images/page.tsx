'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ImagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/media?tab=image');
  }, [router]);

  return null;
}
