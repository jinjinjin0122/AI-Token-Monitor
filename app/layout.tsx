import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Token Investment Monitor',
  description: 'Data-driven monitor for AI token economy investment themes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
