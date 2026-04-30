import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lab Gobeaute P&D',
  description: 'Sistema de gestão de P&D, MPs e fornecedores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
