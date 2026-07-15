import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/contexts/toast-context'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Prisma · Una marca, infinito contenido consistente',
    template: '%s · Prisma',
  },
  description:
    'Prisma refracta el ADN de tu marca en cada pieza de contenido: genera con RAG sobre tu manual, gobierna el flujo de aprobación y audita imágenes contra las reglas. Reto Alicorp.',
  applicationName: 'Prisma',
  keywords: ['Alicorp', 'brand compliance', 'RAG', 'gobernanza de marca', 'IA generativa', 'auditoría multimodal'],
  authors: [{ name: 'Christian Valdivia' }],
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Prisma',
    title: 'Prisma · Una marca, infinito contenido consistente',
    description:
      'Refracta el ADN de tu marca en contenido siempre consistente. Genera, gobierna y audita con IA. Reto Alicorp.',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary',
    title: 'Prisma · Una marca, infinito contenido consistente',
    description: 'Refracta el ADN de tu marca en contenido consistente. Genera, gobierna y audita con IA. Reto Alicorp.',
  },
  generator: 'Next.js',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

// Aplica el tema guardado antes de pintar para evitar flash (FOUC).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.classList.add(t);}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${jakarta.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
      style={{ colorScheme: 'light dark' }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
