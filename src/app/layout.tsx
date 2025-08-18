import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AmplifyProvider } from '@/components/providers/AmplifyProvider';

export const metadata: Metadata = {
  title: 'Pies - Gra Karciana',
  description: 'Gra karciana Pies online dla 4 graczy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <AmplifyProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
