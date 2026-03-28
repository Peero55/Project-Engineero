import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';

const display = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Legendary Hunts Starter',
  description: 'React starter repo for the Legendary Hunts MVP.',
};

const nav = [
  ['Dashboard', '/dashboard'],
  ['Map', '/map'],
  ['Hunts', '/hunts'],
  ['Battle', '/battle'],
  ['Profile', '/profile'],
  ['Admin', '/admin'],
  ['Docs', '/docs'],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <h1 className={display.className}>Legendary Hunts</h1>
            <div className="subtitle">React starter repo + no-drift agent handoff</div>
            <nav className="nav">
              {nav.map(([label, href]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
