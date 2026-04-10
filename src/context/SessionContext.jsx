import { createContext, useContext, useEffect, useState } from 'react';

const SESSION_STORAGE_KEY = 'socs-booking-session';

const SessionContext = createContext(null);

function inferRoleFromEmail(email) {
  if (email.endsWith('@mcgill.ca')) {
    return 'owner';
  }

  if (email.endsWith('@mail.mcgill.ca')) {
    return 'student';
  }

  return null;
}

function formatNameFromEmail(email) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStoredSession() {
  const storedValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return null;
  }
}

function SessionProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredSession());

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [currentUser]);

  const login = ({ email, name }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const role = inferRoleFromEmail(trimmedEmail);

    if (!role) {
      return {
        success: false,
        message: 'Use a McGill email ending in @mcgill.ca or @mail.mcgill.ca.',
      };
    }

    const user = {
      name: trimmedName || formatNameFromEmail(trimmedEmail),
      email: trimmedEmail,
      role,
    };

    setCurrentUser(user);

    return {
      success: true,
      user,
    };
  };

  const logout = () => setCurrentUser(null);

  return <SessionContext.Provider value={{ currentUser, login, logout }}>{children}</SessionContext.Provider>;
}

function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used inside SessionProvider.');
  }

  return context;
}

export { SessionProvider, useSession };
