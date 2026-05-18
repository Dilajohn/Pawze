import { Bell, ChevronDown, LogOut, Menu, PawPrint, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

const navItems = [
  { label: 'Services', href: '/#services' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Contact', href: '/#contact' },
]

function Header() {
  const { currentUser, logout, lowStockItems, getDashboardPath } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isLanding = location.pathname === '/'

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 24)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMenus() {
    setMobileOpen(false)
    setMenuOpen(false)
  }

  function handleLogout() {
    closeMenus()
    logout()
    navigate('/')
  }

  const shellClass = isLanding && !isScrolled
    ? 'border-white/10 bg-transparent'
    : 'border-white/10 bg-[rgba(12,13,18,0.78)] backdrop-blur-xl shadow-2xl shadow-black/20'

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${shellClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" onClick={closeMenus} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-mint) to-(--color-peach) text-(--color-ink) shadow-lg shadow-(--color-peach)/20">
            <PawPrint size={20} />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight text-white">Pawze</div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/50">Tail-wag workflows</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={closeMenus} className="text-sm text-white/70 transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {currentUser ? (
            <>
                <Link
                to={getDashboardPath(currentUser.role)}
                onClick={closeMenus}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/85 transition hover:border-(--color-peach)/50 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="relative rounded-full border border-white/10 p-3 text-white/70 transition hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {lowStockItems.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-peach) px-1 text-[10px] font-semibold text-(--color-ink)">
                      {lowStockItems.length}
                    </span>
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left"
                >
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-9 w-9 rounded-full object-cover" />
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-white">{currentUser.name}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">{currentUser.role}</div>
                  </div>
                  <ChevronDown size={16} className="text-white/50" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-white/10 bg-(--color-panel) p-3 shadow-2xl shadow-black/20">
                    <NavLink
                      to={getDashboardPath(currentUser.role)}
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                    >
                      <User size={16} />
                      Open dashboard
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenus} className="text-sm text-white/70 transition hover:text-white">
                Log in
              </Link>
              <Link to="/register" onClick={closeMenus} className="button-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-full border border-white/10 p-3 text-white lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[rgba(12,13,18,0.96)] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMenus}
                className="rounded-2xl px-3 py-3 text-white/80 transition hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
            {currentUser ? (
              <>
                <Link
                  to={getDashboardPath(currentUser.role)}
                  onClick={closeMenus}
                  className="rounded-2xl bg-white/5 px-3 py-3 text-white"
                >
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-2xl border border-white/10 px-3 py-3 text-left text-white/80">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenus} className="rounded-2xl bg-white/5 px-3 py-3 text-white">
                  Log in
                </Link>
                <Link to="/register" onClick={closeMenus} className="button-primary text-center">
                  Create account
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
