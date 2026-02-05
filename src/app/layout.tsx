import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kicktraquer - Suivi de campagnes de financement participatif',
  description: 'Application de suivi de vos campagnes de financement participatif (Kickstarter, Gamefound, etc.)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
