import Link from "next/link"

interface Socials {
  facebook: string
  instagram: string
  twitter: string
  pinterest: string
  tiktok: string
  youtube: string
  linkedin: string
}

async function getSocials(): Promise<Socials> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public/socials`, { next: { revalidate: 60 } })
    if (!res.ok) return { facebook: '', instagram: '', twitter: '', pinterest: '', tiktok: '', youtube: '', linkedin: '' }
    return (await res.json()) as Socials
  } catch {
    return { facebook: '', instagram: '', twitter: '', pinterest: '', tiktok: '', youtube: '', linkedin: '' }
  }
}

export default async function AboutPage() {
  const socials = await getSocials()
  return (
    <main className="flex-1 pt-16 sm:pt-18">
      <section className="bg-gradient-to-br from-slate via-[#1a1a1a] to-black py-20 sm:py-28">
        <div className="container-main text-center">
          <p className="text-paper/60 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
            Desde 2009
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-ember leading-[1.1]" style={{ textShadow: "0 0 20px rgba(196,227,38,0.3)" }}>
            Quiénes Somos
          </h1>
          <p className="mt-4 text-paper/70 text-lg max-w-lg mx-auto">
            Más de 25 años de experiencia en el mundo del deporte
          </p>
        </div>
      </section>

      <section className="container-main py-16 sm:py-24">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4">
              Nuestra Historia
            </h2>
            <div className="space-y-4 text-[#6B6863] leading-relaxed">
              <p>
                Raquetas Canarias se crea en el año 2009, fruto de la adaptación al mundo online de una empresa 
                dedicada exclusivamente al deporte y con una experiencia de más de 25 años.
              </p>
              <p>
                Raquetas Canarias es una empresa joven y dinámica, especializada en tenis, pádel, squash, 
                trekking y senderismo. Nuestra experiencia adquirida durante estos años nos ha permitido 
                acercarnos aún más a nuestra fiel clientela.
              </p>
              <p>
                Realizamos envíos a cualquier parte del mundo.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 py-8 border-t border-b border-[#DDD8CC]">
            <div>
              <p className="font-display text-3xl font-bold text-ember">2009</p>
              <p className="text-sm text-[#8A8680] mt-1">Año de fundación</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-ember">+25</p>
              <p className="text-sm text-[#8A8680] mt-1">Años de experiencia</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-ember">Mundo</p>
              <p className="text-sm text-[#8A8680] mt-1">Envíos internacionales</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4">
              Especialidades
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Tenis", "Pádel", "Squash", "Trekking", "Senderismo"].map((sport) => (
                <div
                  key={sport}
                  className="px-4 py-3 rounded-xl bg-linen/60 border border-[#DDD8CC] text-center text-sm font-medium text-ink"
                >
                  {sport}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4">
              Contacto
            </h2>
            <div className="space-y-4 text-[#6B6863] leading-relaxed">
              <p>Puedes contactar con nosotros a través de los siguientes canales:</p>
              <div className="space-y-3">
                <a
                  href="mailto:info@raquetascanarias.com"
                  className="flex items-center gap-3 p-3 rounded-xl bg-linen/60 border border-[#DDD8CC] text-ink hover:bg-linen transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember shrink-0">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>info@raquetascanarias.com</span>
                </a>
                <a
                  href="tel:644409549"
                  className="flex items-center gap-3 p-3 rounded-xl bg-linen/60 border border-[#DDD8CC] text-ink hover:bg-linen transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>644 40 95 49</span>
                </a>
                <a
                  href="https://wa.me/34644409549"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-linen/60 border border-[#DDD8CC] text-ink hover:bg-linen transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember shrink-0">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-linen/60 border border-[#DDD8CC] text-ink hover:bg-linen transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember shrink-0">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ember hover:text-ember/80 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
              Volver a la tienda
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
