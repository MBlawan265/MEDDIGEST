import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// Rebuild trigger
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MEDDIGEST - Medical Learning Platform',
    description: 'Simplifying complex medical concepts for students and professionals.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
