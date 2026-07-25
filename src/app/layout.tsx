import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/providers/AppProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EventSync — Event Rental & Asset Synchronization',
  description:
    'Synchronize event schedules, rental contracts, equipment usage, and asset tracking in one platform. Reduce unnecessary rental costs and prevent idle equipment.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var theme = localStorage.getItem('eventsync-theme');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            })();
          `,
          }}
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
