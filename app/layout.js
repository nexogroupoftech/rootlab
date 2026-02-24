import './globals.css'

export const metadata = {
  title: 'RootLab — Nexocorp Learning Engine',
  description: 'Structured AI learning engine powered by Google Gemini',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
