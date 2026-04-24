import { Link } from 'react-router-dom';
import AccountPanel from '../components/AccountPanel';
import BrandLink from '../components/BrandLink';
import HeroCalendar from '../components/HeroCalendar';

//Stalbek Ulanbek uulu 261102435

const productName = 'SOCS Booking';

const workflow = [
  {
    step: 'Find the person you need',
    text: 'Browse professors and teaching assistants with active availability, or open a shared link for one specific person.',
  },
  {
    step: 'Choose an available time',
    text: 'Look through open slots and reserve a time that works for your schedule.',
  },
  {
    step: 'Manage your appointments',
    text: 'See your upcoming bookings, cancel if needed, and contact the slot owner when plans change.',
  },
];

const highlights = [
  {
    title: 'Office hours and appointments',
    text: 'Professors and TAs can post bookable slots for office hours, meetings, and one-on-one help.',
  },
  {
    title: 'Recurring availability',
    text: 'Weekly availability can be repeated across the semester instead of being entered one slot at a time.',
  },
  {
    title: 'Clear booking visibility',
    text: 'Students can review their bookings, and owners can see who reserved each available time.',
  },
];

const heroPoints = [
  'For office hours, advising, quick questions, and recurring availability',
  'For McGill students booking time with professors and teaching assistants',
  'For keeping available slots and booked meetings in one place',
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
              <h1>Simpler office-hour booking at McGill.</h1>
              <p className="hero-text">
                {productName} gives the School of Computer Science one place to post office hours, share
                booking links, and reserve appointment times.
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
              <h2>Book time with less email and less back-and-forth.</h2>
              <p className="section-lead">
                Book a time, confirm it, and keep track of it without having to manage the whole process by email.
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
              <h2>Built around the way academic scheduling actually works.</h2>
              <p className="section-lead">
                The focus is on the everyday parts of office hours: posting slots, booking them, and seeing what is already taken.
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
            <p className="eyebrow">For office hours and bookings</p>
            <h2>A booking tool for office hours, meetings, and student support.</h2>
            <p className="footer-copy">
              Post availability, share a booking link, reserve open times, and keep track of appointments without scattered messages.
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
