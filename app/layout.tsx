import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

// Use system fonts for better performance and to avoid Google Fonts download issues
// This eliminates the delay from font downloads

export const metadata: Metadata = {
  title: "Crivus QuizIQ",
  description: "Plataforma completa para criar, rastrear e analisar quizzes interativos",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body 
        className="font-sans antialiased" 
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
        suppressHydrationWarning
      >
        <div suppressHydrationWarning>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
