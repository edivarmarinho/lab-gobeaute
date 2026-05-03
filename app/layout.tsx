import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lab Gobeaute P&D',
  description: 'Sistema de gestão de P&D, MPs e fornecedores',
}

// Inline script para aplicar tema antes do paint (sem FOUC)
const themeInit = `
(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100 transition-colors">{children}</body>
    </html>
  )
}
