import type { Metadata } from 'next';
import './globals.css';
import './auth.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: 'EB DO MIG | Central Militar',
  description: 'Central de comando, capacitação e gestão militar do EB DO MIG.',
  openGraph: {title:'EB DO MIG | Central Militar',description:'Central de comando, capacitação e gestão militar do EB DO MIG.',images:['/og.png']},
  twitter: {card:'summary_large_image',title:'EB DO MIG | Central Militar',description:'Central de comando, capacitação e gestão militar do EB DO MIG.',images:['/og.png']},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
