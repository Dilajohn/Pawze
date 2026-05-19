import { Mail, MapPin, PawPrint, Phone, Send } from 'lucide-react'

function Footer() {
  return (
    <footer id="contact" style={{ borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
      {/* wavy top accent */}
      <div style={{ lineHeight: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
          <path d="M0 24 C240 48 480 0 720 24 C960 48 1200 0 1440 24 L1440 0 L0 0 Z" fill="rgba(122,170,106,0.06)" />
        </svg>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3.5rem 1.5rem 4rem', display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>

        {/* brand col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PawPrint size={18} color="var(--ink)" />
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Pawze</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.45)' }}>Turning visits into tail-wags</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.85, color: 'rgba(245,240,232,0.55)', maxWidth: '22rem' }}>
            A web-based grooming appointment scheduler and inventory manager designed for fast-moving salons that still want every pet visit to feel warm and personal.
          </p>
          {/* newsletter */}
          <div className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff', marginBottom: '0.6rem' }}>Stay in the loop</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="email" placeholder="Pet parent email"
                style={{ flex: 1, borderRadius: '999px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#fff', outline: 'none' }} />
              <button type="button" className="button-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>Subscribe</button>
            </div>
          </div>
        </div>

        {/* explore */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', color: '#fff', marginBottom: '0.25rem' }}>Explore</div>
          {['Services', 'How it works', 'Testimonials', 'Contact'].map(label => (
            <a key={label} href={`/#${label.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', textDecoration: 'none', transition: 'color 180ms' }}
              onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='rgba(245,240,232,0.55)'}>
              {label}
            </a>
          ))}
        </div>

        {/* contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', color: '#fff', marginBottom: '0.25rem' }}>Contact</div>
          {[
            { Icon: MapPin, text: '14 Emerald Ave, Pasig City' },
            { Icon: Phone, text: '+63 917 777 1824' },
            { Icon: Mail,  text: 'hello@pawze.app' },
            { Icon: Send,  text: '@pawze.studio' },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)' }}>
              <Icon size={15} color="var(--warm)" style={{ flexShrink: 0 }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(245,240,232,0.3)' }}>
        Pawze frontend concept — React · Vite · Tailwind CSS
      </div>
    </footer>
  )
}

export default Footer
