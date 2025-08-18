'use client';

import React, { useEffect } from 'react';
import '@/lib/amplify';

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export const AmplifyProvider: React.FC<AmplifyProviderProps> = ({ children }) => {
  useEffect(() => {
    // Amplify jest już skonfigurowane w @/lib/amplify
    // Ten komponent może być rozszerzony o dodatkowe konfiguracje w przyszłości
  }, []);

  return <>{children}</>;
};
