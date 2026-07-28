import type { Metadata } from "next"
import { Sora, Inter, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { getCategories } from "@/services/supabase-store"
import NavbarWrapper from "@/components/NavbarWrapper"
import "./globals.css"
import { Toaster } from "sonner"

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Sportbalin | Elegancia Deportiva",
  description: "Tu tienda especializada en pádel y tenis. Equipamiento premium con la mejor tecnología.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let categories: { id: string; name: string; slug: string }[] = []
  try {
    categories = await getCategories()
  } catch {}

  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-paper text-ink">
          <NavbarWrapper categories={categories} />
          {children}
          <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
