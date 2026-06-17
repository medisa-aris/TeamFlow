'use client';
import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/hooks/useToasts';
import { makeQueryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

function AuthInitializer({ initialUser }) {
  const setMe = useAuthStore((s) => s.setMe);
  useEffect(() => {
    if (initialUser) setMe(initialUser);
  }, [initialUser, setMe]);
  return null;
}

export default function Providers({ children, initialUser }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
        <ToastProvider>
          <AuthInitializer initialUser={initialUser} />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
