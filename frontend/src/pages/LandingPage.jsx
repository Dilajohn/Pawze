import { ArrowRight, CheckCircle2, PawPrint, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardHighlights, howItWorks, landingStats, services, testimonials } from '../data/mockData.js'

const serviceImages = [
  '/images/animal-shelter.jpg',
  '/images/discover-facts.jpg',
  '/images/german-shepherd.jpg',
  '/images/cutest-puppy.jpg',
]

function WavyDivider({ flip = false, color = 'rgba(19,20,26,1)' }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none', overflow: 'hidden' }}>
      <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
        <path d="M0 40 C240 72 480 8 720 40 C960 72 1200 8 1440 40 L1440 72 L0 72 Z" fill={color} />
      </svg>
    </div>
  )
}

function RibbonText({ children, color = 'rgba(122,170,106,0.18)' }) {
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '1rem 0', borderTop: '1px solid rgba(245,240,232,0.08)', borderBottom: '1px solid rgba(245,240,232,0.08)', background: color }}>
      <div style={{ display: 'inline-flex', animation: 'marquee 22s linear infinite', gap: '4rem' }}>
        {[...Array(3)].map((_, i) => (
          <span key={i} style={{ display: 'inline-flex', gap: '3rem', alignItems: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(245,240,232,0.55)' }}>
            {children}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
    </div>
  )
}

function StarRow() {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="var(--warm)" color="var(--warm)" />)}
    </span>
  )
}

function LandingPage() {
  return (
    <div className="overflow-hidden">

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-glow-a" />
        <div className="hero-glow-b" />

        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'grid', alignItems: 'center', gap: '3rem', paddingTop: '8rem', paddingBottom: '5rem', gridTemplateColumns: '1fr' }} className="lg:grid-cols-[1.1fr_0.9fr]">

          {/* left */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '999px', border: '1px solid rgba(245,240,232,0.12)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem 0.4rem 0.6rem', marginBottom: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,var(--sage),var(--warm))', borderRadius: '999px', padding: '0.3rem' }}>
                <PawPrint size={13} color="var(--ink)" />
              </span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'rgba(245,240,232,0.7)' }}>Grooming workflows with heart</span>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 6.5vw, 5.5rem)', lineHeight: 1.03, color: '#fff', margin: 0 }}>
              Pawze<span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg, var(--sage), var(--warm))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>Happy tail-wags,</span>
              <span style={{ color: '#fff' }}>every visit.</span>
            </h1>

            <p style={{ marginTop: '1.5rem', maxWidth: '30rem', fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--muted)' }}>
              A polished platform for appointment scheduling, pet records, and inventory — built for modern grooming salons.
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/register" className="button-primary">
                Get started <ArrowRight size={15} />
              </Link>
              <Link to="/login" className="button-secondary">
                Try demo <PawPrint size={15} />
              </Link>
            </div>

            {/* mini highlights */}
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {dashboardHighlights.map((item) => (
                <div key={item.title} className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>{item.title}</div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.65, color: 'rgba(245,240,232,0.55)' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* right — hero image + floating cards */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/images/cutest-puppy.jpg" alt="Happy groomed puppy" className="hero-img" />

            {/* top-left float */}
            <div className="float-card" style={{ top: '2rem', left: '-1.5rem' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,240,232,0.4)' }}>Today's flow</div>
              <div style={{ marginTop: '0.3rem', fontSize: '2rem', fontFamily: "'Playfair Display',serif", color: '#fff', lineHeight: 1 }}>18</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.55)', marginTop: '0.2rem' }}>visits · 4 groomers</div>
            </div>

            {/* bottom-right float */}
            <div className="float-card float-card-b" style={{ bottom: '-1.5rem', right: '-1rem', maxWidth: '14rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,240,232,0.4)' }}>Pet profile</div>
                <ShieldCheck size={16} color="var(--sage)" />
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '1.4rem', fontFamily: "'Playfair Display',serif", color: '#fff' }}>Sunny</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.55)', marginTop: '0.25rem', lineHeight: 1.6 }}>Sensitive skin flagged · preferred groomer saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RIBBON ── */}
      <RibbonText color="rgba(122,170,106,0.1)">
        <span>Appointment scheduling</span>
        <span>·</span>
        <span>Pet records</span>
        <span>·</span>
        <span>Inventory tracking</span>
        <span>·</span>
        <span>Role-based access</span>
        <span>·</span>
        <span>Groomer dashboard</span>
        <span>·</span>
        <span>Admin controls</span>
        <span>·</span>
      </RibbonText>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 0 }}>
          {landingStats.map((item, i) => (
            <div key={item.label} style={{ padding: '2rem 1.5rem', borderRight: i < landingStats.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label" style={{ marginTop: '0.4rem' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ maxWidth: '36rem' }}>
            <div className="section-kicker">Services</div>
            <h2 className="section-title">Curated grooming packages for every companion.</h2>
            <p className="section-copy">Transparent pricing, clear durations, and a salon-friendly layout that feels premium without sacrificing usability.</p>
          </div>

          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {services.map((service, index) => (
              <article key={service.id} className="service-card">
                <img src={serviceImages[index % serviceImages.length]} alt={service.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display',serif", color: '#fff' }}>{service.name}</h3>
                    <span style={{ flexShrink: 0, borderRadius: '999px', padding: '0.3rem 0.8rem', fontSize: '0.72rem', background: 'rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.6)' }}>{service.duration}</span>
                  </div>
                  <p style={{ margin: '0.6rem 0 1.1rem', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--muted)' }}>{service.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--warm)' }}>${service.price}</span>
                    <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(245,240,232,0.7)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 180ms' }}>
                      Book service <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAVY divider + HOW IT WORKS ── */}
      <WavyDivider color="rgba(19,20,26,1)" />
      <section id="how-it-works" style={{ background: 'var(--panel)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gap: '3rem', gridTemplateColumns: '1fr' }} className="lg:grid-cols-[0.95fr_1.05fr]">
          {/* editorial image block */}
          <div style={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--border)', minHeight: '400px' }}>
            <img src="/images/german-shepherd.jpg" alt="Grooming session" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '400px' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(10,11,15,0.9))', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem' }}>
              <div className="section-kicker">Visual direction</div>
              <h3 style={{ margin: '0.5rem 0 0', fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#fff', lineHeight: 1.15 }}>Warm editorial styling with bold contrast and pet-centered imagery.</h3>
            </div>
          </div>

          {/* steps */}
          <div>
            <div className="section-kicker">How it works</div>
            <h2 className="section-title" style={{ marginBottom: '1.75rem' }}>From booking to bow — four smooth steps.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {howItWorks.map((item) => (
                <div key={item.step} className="step-card">
                  <div className="step-num">{item.step}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>{item.title}</h3>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--muted)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <WavyDivider color="rgba(19,20,26,1)" flip />

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <div className="section-kicker">Testimonials</div>
              <h2 className="section-title" style={{ margin: '0.5rem 0 0', maxWidth: '32rem' }}>Thoughtful for customers, controlled for salon teams.</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StarRow />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Loved by salons</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map((item, index) => (
              <article key={item.name} className="testi-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  <img
                    src={index === 0 ? '/images/cutest-puppy.jpg' : index === 1 ? '/images/animal-shelter.jpg' : '/images/image-7.jpg'}
                    alt={item.name}
                    style={{ width: '3rem', height: '3rem', borderRadius: '1rem', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.45)' }}>{item.role}</div>
                  </div>
                </div>
                <StarRow />
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--muted)', position: 'relative', zIndex: 1 }}>"{item.quote}"</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(245,240,232,0.55)' }}>
            <CheckCircle2 size={16} color="var(--sage)" />
            Aligned with the research scope: online scheduling, customer records, inventory tracking, and responsive access.
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div className="cta-panel">
            <div>
              <div className="section-kicker">Launch ready</div>
              <h2 className="section-title" style={{ maxWidth: '32rem' }}>See all three dashboards working together in one click.</h2>
              <p className="section-copy" style={{ maxWidth: '30rem' }}>
                Demo accounts are one click away — inspect the admin, groomer, and customer experiences without typing a single credential.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" className="button-primary">
                Open demo login <ArrowRight size={15} />
              </Link>
              <Link to="/register" className="button-secondary">
                Register a user <PawPrint size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage
