import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sudoku Max',
  description: 'Play today\'s Sudoku or solve one from a picture.'
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
