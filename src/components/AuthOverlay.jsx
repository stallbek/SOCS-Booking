import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function AuthOverlay({ mode }) {
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(false);
  const isRegister = mode === 'register';

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowNotice(true);
  };

  return (
    <div aria-modal="true" className="auth-overlay" role="dialog">
      <button
        aria-label="Close authentication panel"
        className="auth-overlay-backdrop"
        onClick={() => navigate('/')}
        type="button"
      ></button>

      <section className={`auth-overlay-panel${isRegister ? ' auth-overlay-panel-register' : ''}`}>
        <div className="auth-overlay-head">
          <div className="auth-overlay-heading">
            <p className="eyebrow">{isRegister ? 'Register' : 'Login'}</p>
            <h2>{isRegister ? 'Create your account.' : 'Log in to SOCS Booking.'}</h2>
            <p className="auth-overlay-copy">
              {isRegister
                ? 'Use your McGill email to register for booking and appointment access.'
                : 'Use your McGill account details to continue.'}
            </p>
          </div>

          <Link aria-label="Close" className="auth-close" to="/">
            <span className="auth-close-mark" aria-hidden="true">
              ×
            </span>
            <span>Close</span>
          </Link>
        </div>

        <div className={`auth-overlay-body${isRegister ? ' auth-overlay-body-register' : ''}`}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-intro">
              <p className="auth-form-kicker">{isRegister ? 'Account details' : 'Sign in'}</p>
              <p className="auth-form-copy">
                {isRegister
                  ? 'Register with the McGill email tied to your role.'
                  : 'Enter the email and password for your account.'}
              </p>
            </div>

            {isRegister ? (
              <div className="auth-form-row">
                <label className="form-field">
                  <span>Name</span>
                  <input placeholder="Full name" type="text" />
                </label>

                <label className="form-field">
                  <span>McGill email</span>
                  <input placeholder="name@mcgill.ca" type="email" />
                </label>
              </div>
            ) : (
              <label className="form-field">
                <span>McGill email</span>
                <input placeholder="name@mcgill.ca" type="email" />
              </label>
            )}

            {isRegister ? (
              <div className="auth-form-row">
                <label className="form-field">
                  <span>Password</span>
                  <input placeholder="Password" type="password" />
                </label>

                <label className="form-field">
                  <span>Confirm password</span>
                  <input placeholder="Repeat password" type="password" />
                </label>
              </div>
            ) : (
              <label className="form-field">
                <span>Password</span>
                <input placeholder="Password" type="password" />
              </label>
            )}

            {!isRegister && (
              <div className="auth-info-box">
                <p className="auth-info-title">McGill emails only</p>
                <span>
                  `@mcgill.ca` accounts are for slot owners, while `@mail.mcgill.ca` and `@mcgill.ca` accounts can reserve active slots.
                </span>
              </div>
            )}

            {showNotice && (
              <div className="auth-notice">
                Authentication is still being connected.
              </div>
            )}

            <button className="button button-primary auth-submit" type="submit">
              {isRegister ? 'Register' : 'Log in'}
            </button>
          </form>

          {isRegister && (
            <aside className="auth-side-panel">
              <div className="auth-side-card">
                <p className="eyebrow">Before you start</p>
                <h3>Use your McGill account details.</h3>
                <p>Registration is limited to McGill addresses so access can match the right university role.</p>
                <div className="auth-side-list" role="list">
                  <div className="auth-side-item" role="listitem">
                    <span className="auth-side-label">Owners</span>
                    <p>`@mcgill.ca` accounts publish and manage slots.</p>
                  </div>
                  <div className="auth-side-item" role="listitem">
                    <span className="auth-side-label">Students</span>
                    <p>`@mail.mcgill.ca` accounts reserve and manage bookings.</p>
                  </div>
                  <div className="auth-side-item" role="listitem">
                    <span className="auth-side-label">Access</span>
                    <p>Each account type sees the booking tools relevant to that role.</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        <div className="auth-switch">
          <span>{isRegister ? 'Already have an account?' : 'Need an account?'}</span>
          <Link className="text-link" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AuthOverlay;
