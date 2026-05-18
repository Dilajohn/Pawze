import { Mail, MapPin, PawPrint, Phone, Send } from 'lucide-react'

function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[var(--color-panel-strong)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:px-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-peach)] text-[var(--color-ink)]">
              <PawPrint size={18} />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-white">Pawze</div>
              <div className="text-sm text-white/55">Turning grooming visits into happy tail-wags</div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/65">
            A web-based grooming appointment scheduler and inventory manager designed for fast-moving salons that
            still want every pet visit to feel warm, calm, and personal.
          </p>
          <div className="glass-panel max-w-md p-4">
            <div className="text-sm font-semibold text-white">Stay in the loop</div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Pet parent email"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button type="button" className="button-primary">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="font-display text-lg text-white">Explore</div>
          <a href="/#services" className="block text-sm text-white/65 transition hover:text-white">
            Services
          </a>
          <a href="/#how-it-works" className="block text-sm text-white/65 transition hover:text-white">
            How it works
          </a>
          <a href="/#testimonials" className="block text-sm text-white/65 transition hover:text-white">
            Testimonials
          </a>
          <a href="/#contact" className="block text-sm text-white/65 transition hover:text-white">
            Contact
          </a>
        </div>

        <div className="space-y-4">
          <div className="font-display text-lg text-white">Contact</div>
          <div className="flex items-center gap-3 text-sm text-white/65">
            <MapPin size={16} className="text-[var(--color-peach)]" />
            14 Emerald Ave, Pasig City
          </div>
          <div className="flex items-center gap-3 text-sm text-white/65">
            <Phone size={16} className="text-[var(--color-peach)]" />
            +63 917 777 1824
          </div>
          <div className="flex items-center gap-3 text-sm text-white/65">
            <Mail size={16} className="text-[var(--color-peach)]" />
            hello@pawze.app
          </div>
          <div className="flex items-center gap-3 text-sm text-white/65">
            <Send size={16} className="text-[var(--color-peach)]" />
            @pawze.studio
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs uppercase tracking-[0.28em] text-white/35">
        Pawze frontend concept - React, Vite, Tailwind CSS
      </div>
    </footer>
  )
}

export default Footer
