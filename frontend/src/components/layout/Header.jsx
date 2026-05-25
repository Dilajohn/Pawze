import { ChevronDown, LogOut, Menu, Moon, PawPrint, Sun, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const navItems = [
  { label: 'Services',     href: '/#services' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Contact',      href: '/#contact' },
]

function Header() {
  const { currentUser, logout, getDashboardPath } = useApp()
  const { theme, isLight, toggleTheme } = useTheme()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const isLanding = location.pathname === '/'

  useEffect(() => {
    function onScroll() { setIsScrolled(window.scrollY > 24) }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMenus() { setMobileOpen(false); setMenuOpen(false) }
  function handleLogout() { closeMenus(); logout(); navigate('/') }

  const scrolled = isScrolled || !isLanding

  // Derive display values from the API-shaped user object
  const displayName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.username
    : null
  const avatarSrc = currentUser?.avatar || null
  const initial   = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <header style={{
      position: 'fixed', inset: '0 0 auto 0', zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: scrolled ? 'var(--header-bg)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'background 300ms ease, backdrop-filter 300ms ease',
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>

        {/* Logo */}
        <Link to="/" onClick={closeMenus} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(122,170,106,0.28)' }}>
            <PawPrint size={18} color="var(--ink)" />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1 }}>Pawze</div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: 'var(--muted-soft)', lineHeight: 1 }}>Tail-wag workflows</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="hidden lg:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={closeMenus}
              style={{ fontSize: '0.9rem', color: 'var(--muted)', textDecoration: 'none', transition: 'color 180ms' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-strong)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="hidden lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            title={`Current theme: ${theme}`}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {currentUser ? (
            <>
              <Link
                to={currentUser.role === 'customer' ? '/customer?tab=booking' : getDashboardPath(currentUser.role)}
                onClick={closeMenus}
                style={{ borderRadius: '999px', border: '1px solid var(--border)', padding: '0.55rem 1.1rem', fontSize: '0.88rem', color: 'var(--muted-strong)', textDecoration: 'none' }}>
                {currentUser.role === 'customer' ? 'Book appointment' : 'Dashboard'}
              </Link>

              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setMenuOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: '999px', border: '1px solid var(--border)', background: 'var(--card-soft)', padding: '0.45rem 0.75rem 0.45rem 0.45rem', cursor: 'pointer' }}>

                  {avatarSrc
                    ? <img src={avatarSrc} alt={displayName} style={{ width: '2.2rem', height: '2.2rem', borderRadius: '999px', objectFit: 'cover' }} />
                    : (
                      <div style={{ width: '2.2rem', height: '2.2rem', borderRadius: '999px', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>
                        {initial}
                      </div>
                    )
                  }

                  <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-strong)' }}>{displayName}</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--muted-soft)' }}>{currentUser.role}</div>
                  </div>
                  <ChevronDown size={15} color="var(--muted)" />
                </button>

                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.75rem)', width: '14rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--panel)', padding: '0.6rem', boxShadow: '0 24px 64px var(--shadow-strong)', zIndex: 100 }}>
                    <NavLink to={currentUser.role === 'customer' ? '/customer' : getDashboardPath(currentUser.role)} onClick={closeMenus}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: '1rem', padding: '0.75rem 0.85rem', fontSize: '0.88rem', color: 'var(--muted-strong)', textDecoration: 'none' }}>
                      <User size={15} /> Open dashboard
                    </NavLink>
                    <button type="button" onClick={handleLogout}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.6rem', borderRadius: '1rem', padding: '0.75rem 0.85rem', fontSize: '0.88rem', color: 'var(--muted-strong)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenus} style={{ fontSize: '0.9rem', color: 'var(--muted)', textDecoration: 'none' }}>
                Staff log in
              </Link>
              <Link to="/register" onClick={closeMenus} style={{ fontSize: '0.9rem', color: 'var(--muted)', textDecoration: 'none' }}>
                Register
              </Link>
              <Link to="/book" onClick={closeMenus} className="button-primary" style={{ padding: '0.65rem 1.3rem', fontSize: '0.88rem' }}>
                Book now
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
          title={`Current theme: ${theme}`}
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button type="button" onClick={() => setMobileOpen(v => !v)}
          style={{ borderRadius: '999px', border: '1px solid var(--border)', padding: '0.6rem', color: 'var(--text-strong)', background: 'none', cursor: 'pointer' }}
          className="lg:hidden" aria-label="Toggle nav">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--header-mobile-bg)', padding: '1rem 1.5rem' }} className="lg:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={closeMenus}
                style={{ borderRadius: '1rem', padding: '0.75rem 1rem', color: 'var(--muted-strong)', textDecoration: 'none', display: 'block' }}>
                {item.label}
              </a>
            ))}
            {currentUser ? (
              <>
                <Link to={getDashboardPath(currentUser.role)} onClick={closeMenus}
                  style={{ borderRadius: '1rem', background: 'var(--surface-soft)', padding: '0.75rem 1rem', color: 'var(--text-strong)', textDecoration: 'none', display: 'block' }}>
                  Dashboard
                </Link>
                {currentUser.role === 'customer' && (
                  <Link to="/customer?tab=booking" onClick={closeMenus}
                    style={{ borderRadius: '1rem', background: 'var(--surface-soft)', padding: '0.75rem 1rem', color: 'var(--text-strong)', textDecoration: 'none', display: 'block' }}>
                    Book appointment
                  </Link>
                )}
                <button type="button" onClick={handleLogout}
                  style={{ borderRadius: '1rem', border: '1px solid var(--border)', padding: '0.75rem 1rem', color: 'var(--muted-strong)', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenus}
                  style={{ borderRadius: '1rem', background: 'var(--surface-soft)', padding: '0.75rem 1rem', color: 'var(--text-strong)', textDecoration: 'none', display: 'block' }}>
                  Staff log in
                </Link>
                <Link to="/register" onClick={closeMenus}
                  style={{ borderRadius: '1rem', background: 'var(--surface-soft)', padding: '0.75rem 1rem', color: 'var(--text-strong)', textDecoration: 'none', display: 'block' }}>
                  Register
                </Link>
                <Link to="/book" onClick={closeMenus} className="button-primary" style={{ textAlign: 'center' }}>
                  Book now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
