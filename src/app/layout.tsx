import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
