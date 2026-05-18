import { ArrowRight, CheckCircle2, PawPrint, ShieldCheck, Sparkles, Stars } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardHighlights, howItWorks, landingStats, services, testimonials } from '../data/mockData.js'

function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="hero-mesh relative isolate min-h-screen">
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/75">
              <Sparkles size={14} className="text-[var(--color-peach)]" />
              Grooming operations with heart
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Pawze
              <span className="mt-2 block bg-gradient-to-r from-[var(--color-mint)] via-white to-[var(--color-peach)] bg-clip-text text-transparent">
                Turning grooming visits into happy tail-wags
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              A polished web experience for appointment scheduling, pet records, and inventory management built
              for modern grooming salons and the humans who keep them running.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="button-primary inline-flex items-center justify-center gap-2">
                Launch Pawze
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="button-secondary inline-flex items-center justify-center gap-2">
                Try demo access
                <PawPrint size={16} />
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {dashboardHighlights.map((item) => (
                <div key={item.title} className="glass-panel p-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[var(--color-peach)]">
                    <Stars size={18} />
                  </div>
                  <div className="text-base font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-peach)]/15 via-transparent to-[var(--color-mint)]/10 blur-3xl" />
            <div className="relative w-full max-w-xl">
              <div className="absolute -left-6 top-12 hidden rounded-3xl border border-white/10 bg-[var(--color-panel)]/80 p-4 shadow-2xl backdrop-blur-xl md:block">
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">Today’s flow</div>
                <div className="mt-2 text-3xl font-semibold text-white">18 visits</div>
                <div className="mt-1 text-sm text-white/55">4 groomers synced, 2 low-stock reminders</div>
              </div>
              <img
                src="/images/cutest-puppy.jpg"
                alt="Happy puppy"
                className="hero-image relative z-10 h-[620px] w-full rounded-[2.5rem] object-cover object-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              />
              <div className="absolute -bottom-8 right-0 w-72 rounded-[2rem] border border-white/10 bg-[rgba(12,13,18,0.85)] p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-white/40">Pet profile</div>
                    <div className="mt-2 text-2xl font-semibold text-white">Sunny</div>
                  </div>
                  <ShieldCheck className="text-[var(--color-mint)]" size={22} />
                </div>
                <div className="mt-3 text-sm leading-6 text-white/60">
                  Sensitive skin flagged, preferred groomer saved, reminders enabled.
                </div>
              </div>
            </div>
            <div className="paw paw-1" />
            <div className="paw paw-2" />
            <div className="paw paw-3" />
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-[var(--color-panel)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {landingStats.map((item) => (
            <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-6">
              <div className="font-display text-3xl text-white">{item.value}</div>
              <div className="mt-2 text-sm uppercase tracking-[0.2em] text-white/45">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="section-kicker">Services</div>
          <h2 className="section-title">Design-led service cards inspired by boutique pet brands.</h2>
          <p className="section-copy">
            Each offering pairs clear timing and pricing with a salon-friendly layout that feels premium without
            sacrificing usability.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {services.map((service, index) => (
            <article key={service.id} className="service-card group">
              <img
                src={index % 2 === 0 ? '/images/animal-shelter.jpg' : '/images/discover-facts.jpg'}
                alt={service.name}
                className="h-48 w-full rounded-[1.75rem] object-cover"
              />
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{service.description}</p>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/75">{service.duration}</div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-semibold text-[var(--color-peach)]">${service.price}</span>
                <button type="button" className="inline-flex items-center gap-2 text-sm text-white/80 transition group-hover:text-white">
                  Book service
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[var(--color-panel)] p-6">
            <div className="section-kicker">Visual direction</div>
            <h2 className="section-title max-w-md">Warm editorial styling with bold contrast and pet-centered imagery.</h2>
            <p className="section-copy max-w-lg">
              The layout borrows from the reference compositions you shared: dramatic dark hero treatments,
              oversized pet photography, soft peach highlights, and calm rounded cards.
            </p>
            <img src="/images/german-shepherd.jpg" alt="German shepherd" className="mt-8 h-[420px] w-full rounded-[2rem] object-cover" />
          </div>
          <div id="how-it-works" className="grid gap-5">
            {howItWorks.map((item) => (
              <div key={item.step} className="glass-panel flex gap-5 p-6">
                <div className="font-display text-4xl text-[var(--color-mint)]">{item.step}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="border-y border-white/10 bg-[var(--color-panel)]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="section-kicker">Testimonials</div>
          <h2 className="section-title max-w-2xl">Built to feel thoughtful for customers and controlled for salon teams.</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <article key={item.name} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={index === 0 ? '/images/cutest-puppy.jpg' : index === 1 ? '/images/animal-shelter.jpg' : '/images/image-7.jpg'}
                    alt={item.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-sm text-white/45">{item.role}</div>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-white/65">“{item.quote}”</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/60">
            <CheckCircle2 className="text-[var(--color-mint)]" size={16} />
            Aligned with the research scope: online scheduling, customer records, inventory tracking, and responsive access.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="cta-panel">
          <div>
            <div className="section-kicker">Launch ready</div>
            <h2 className="section-title max-w-2xl">See the landing page, auth flow, role access, and three dashboards working together.</h2>
            <p className="section-copy max-w-xl">
              Demo accounts are one click away, so you can inspect the admin, groomer, and customer experiences
              without typing a single credential.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="button-primary inline-flex items-center justify-center gap-2">
              Open demo login
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="button-secondary inline-flex items-center justify-center gap-2">
              Register a user
              <PawPrint size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
