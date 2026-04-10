import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

function AccountPanel({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();
  const isRegister = mode === 'register';
  const [feedback, setFeedback] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const redirectTo = location.state?.redirectTo || '/app/dashboard';

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isRegister && !formValues.name.trim()) {
      setFeedback('Enter your name before creating the account.');
      return;
    }

    if (!formValues.email.trim()) {
      setFeedback('Enter your McGill email address.');
      return;
    }

    if (!formValues.password.trim()) {
      setFeedback('Enter your password.');
      return;
    }

    if (isRegister && formValues.password !== formValues.confirmPassword) {
      setFeedback('Passwords do not match.');
      return;
    }

    const result = login({
      email: formValues.email,
      name: formValues.name,
    });

    if (!result.success) {
      setFeedback(result.message);
      return;
    }

    navigate(redirectTo, { replace: true });
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
              X
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
                  <input name="name" onChange={handleChange} placeholder="Full name" type="text" value={formValues.name} />
                </label>

                <label className="form-field">
                  <span>McGill email</span>
                  <input name="email" onChange={handleChange} placeholder="name@mcgill.ca" type="email" value={formValues.email} />
                </label>
              </div>
            ) : (
              <label className="form-field">
                <span>McGill email</span>
                <input name="email" onChange={handleChange} placeholder="name@mcgill.ca" type="email" value={formValues.email} />
              </label>
            )}

            {isRegister ? (
              <div className="auth-form-row">
                <label className="form-field">
                  <span>Password</span>
                  <input name="password" onChange={handleChange} placeholder="Password" type="password" value={formValues.password} />
                </label>

                <label className="form-field">
                  <span>Confirm password</span>
                  <input
                    name="confirmPassword"
                    onChange={handleChange}
                    placeholder="Repeat password"
                    type="password"
                    value={formValues.confirmPassword}
                  />
                </label>
              </div>
            ) : (
              <label className="form-field">
                <span>Password</span>
                <input name="password" onChange={handleChange} placeholder="Password" type="password" value={formValues.password} />
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

            {feedback ? <div className="auth-notice">{feedback}</div> : null}

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
          <Link className="text-link" state={location.state} to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AccountPanel;
