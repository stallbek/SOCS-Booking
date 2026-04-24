import { Link } from 'react-router-dom';
import AccountPanel from '../components/AccountPanel';
import BrandLink from '../components/BrandLink';
import HeroCalendar from '../components/HeroCalendar';

//Stalbek Ulanbek uulu 261102435

const productName = 'SOCS Booking';

const workflow = [
  {
    step: 'Request a meeting',
    text: 'Send a meeting request to any professor or TA. They review it on their dashboard and accept or decline.',
  },
  {
    step: 'Schedule a group meeting',
    text: 'An owner picks available time windows and invites participants. Everyone votes on the times that work, and the owner picks the best fit.',
  },
  {
    step: 'Reserve office hours',
    text: 'Professors post recurring weekly office hours. Students browse open slots and reserve a time directly.',
  },
];

const highlights = [
  {
    title: 'Shareable invitation links',
    text: 'Owners generate a direct booking link they can share in slides or emails. Students click it, log in, and see only that owner\'s available slots.',
  },
  {
    title: 'Role-based access',
    text: 'Professors and TAs (@mcgill.ca) create and manage slots. Students (@mail.mcgill.ca) browse owners, reserve times, and manage their bookings.',
  },
  {
    title: 'Dashboard for everyone',
    text: 'Both owners and students get a personal dashboard showing upcoming appointments, booking status, and quick actions like cancel or email.',
  },
];

const heroPoints = [
  'Three booking types: individual meetings, group meetings, and office hours',
  'Only McGill emails can register — owners create slots, students reserve them',
  'Shareable invitation links so owners can distribute booking pages directly',
];

function LandingPage({ authMode }) {
  return (
    <>
      <div className={`page-shell${authMode ? ' page-shell-has-overlay' : ''}`}>
        <header className="site-header">
          <BrandLink />

          <nav className="site-nav" aria-label="Primary">
            <a href="#overview">Overview</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
          </nav>

          <div className="header-actions">
            <Link className="button button-muted" to="/login">
              Log in
            </Link>
            <Link className="button button-primary" to="/register">
              Register
            </Link>
          </div>
        </header>

        <main id="top">
          <section className="hero section-grid" id="overview">
            <div className="hero-copy">
              <p className="eyebrow">McGill School of Computer Science</p>
              <h1>Meetings, group scheduling, and office hours at McGill.</h1>
              <p className="hero-text">
                {productName} lets SOCS professors and TAs manage individual meeting requests,
                schedule group meetings, and post recurring office hours — all in one place.
              </p>

              <div className="hero-actions">
                <Link className="button button-primary" to="/register">
                  Create account
                </Link>
                <Link className="button button-outline" to="/login">
                  Log in
                </Link>
              </div>

              <ul className="hero-points" aria-label="Platform benefits">
                {heroPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <HeroCalendar />
          </section>

          <section className="info-section" id="how-it-works">
            <div className="section-heading">
              <p className="eyebrow">How it works</p>
              <h2>Three ways to book time with professors and TAs.</h2>
              <p className="section-lead">
                Request a one-on-one meeting, coordinate a group time, or reserve an office-hour slot — each type has its own flow.
              </p>
            </div>

            <div className="workflow-grid">
              {workflow.map((item, index) => (
                <article className="workflow-card" key={item.step}>
                  <span className="step-number">0{index + 1}</span>
                  <h3>{item.step}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section" id="features">
            <div className="section-heading">
              <p className="eyebrow">Feature highlights</p>
              <h2>Built around how professors and students actually meet.</h2>
              <p className="section-lead">
                Each booking type handles a different use case — from quick one-on-one requests to semester-long office hours.
              </p>
            </div>

            <div className="feature-grid">
              {highlights.map((item) => (
                <article className="feature-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div>
            <p className="eyebrow">For SOCS at McGill</p>
            <h2>Individual meetings, group scheduling, and office hours — one app.</h2>
            <p className="footer-copy">
              Owners post availability and manage requests. Students reserve slots, vote on group times, and track all their bookings from one dashboard.
            </p>
          </div>

          <div className="footer-actions">
            <Link className="button button-muted" to="/login">
              Log in
            </Link>
            <Link className="button button-primary" to="/register">
              Register
            </Link>
          </div>
        </footer>
      </div>

      {authMode && <AccountPanel mode={authMode} />}
    </>
  );
}

export default LandingPage;
