export const metadata = {
  title: 'Care Guide BD | Doctor Tracker',
  description: 'Full-stack Doctor and Patient Tracking System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
