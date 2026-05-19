import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-side hidden lg:block">
          <img src="/images/german-shepherd.jpg" alt="Dog grooming" className="h-full w-full rounded-[2rem] object-cover" />
          <div className="auth-overlay">
            <div className="section-kicker">Access model</div>
            <div className="mt-2 text-3xl font-semibold text-white">Customer booking is public. Staff access is provisioned.</div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/70">
              Admins create staff accounts, assign initial passwords, and control which dashboard each team member can enter.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-8">
          <div className="section-kicker">Registration disabled</div>
          <h1 className="mt-2 font-display text-4xl text-white">Accounts are no longer self-serve.</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
            Customers use the public appointment flow for dog grooming visits. Groomers and admins receive their login
            credentials from an admin after the account is created in the staff management area.
          </p>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/4 p-5">
            <div className="text-sm font-semibold text-white">What to do instead</div>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <div>1. Customers: open the dog booking page and submit an appointment request.</div>
              <div>2. Groomers/Admins: use the staff login page after receiving an initial password.</div>
              <div>3. Admins: create and reset staff credentials from the admin dashboard.</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book" className="button-primary">
              Book a dog appointment
            </Link>
            <Link to="/login" className="button-secondary">
              Open staff login
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
