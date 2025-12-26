import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "QASE - Quantum Assertion of Stable Existence",
  description:
    "Advanced quantum state visualization with cryptographic entropy analysis, particle effects, and real-time quantum metrics",
  generator: "v0.app",
  keywords: [
    "quantum",
    "cryptography",
    "entropy",
    "visualization",
    "interactive",
    "particles",
    "quantum computing",
    "stable existence",
  ],
  authors: [{ name: "Ibrahim Ghonem", url: "https://github.com/ibrahimghonem" }],
  creator: "Ibrahim Ghonem",
  openGraph: {
    title: "QASE - Quantum Assertion of Stable Existence",
    description: "Advanced quantum state visualization and entropy analysis system",
    type: "website",
    locale: "en_US",
  },
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050a15" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QASE" />
      </head>
      <body className={`${_geist.className} antialiased`} style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
