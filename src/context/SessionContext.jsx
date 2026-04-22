import { createContext, useContext, useEffect, useState } from 'react';

const AUTH_API_BASE_URL = 'http://localhost:5000/api/auth';

//context used to share session data
const SessionContext = createContext(null);

function SessionProvider({ children }) {

  //stores logged in user
  const [currentUser, setCurrentUser] = useState(null);

  //used while checking session on page load
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    //check if user already logged in with cookie session
    const checkSession = async () => {
      try {
        const response = await fetch(`${AUTH_API_BASE_URL}/me`, {
          credentials: 'include'
        });

        //if no valid session then keep user null
        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        //get user info from backend
        const data = await response.json();

        //save logged in user
        setCurrentUser(data.user);

      } catch (error) {

        //if server error just reset user
        setCurrentUser(null);

      } finally {

        //done checking session
        setLoading(false);
      }
    };

    //run once when component loads
    checkSession();

  }, []);

  const login = async ({ email, password }) => {
    try {

      //send login request
      const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      //if login failed return message
      if (!response.ok) {
        return {
          success: false,
          message: data.error
        };
      }

      //store logged in user
      setCurrentUser(data.user);

      return {
        success: true,
        user: data.user
      };

    } catch (error) {

      //backend/server issue
      return {
        success: false,
        message: 'Something went wrong. Please try again.'
      };
    }
  };

  const register = async ({ name, email, password, confirmPassword }) => {
  try {

    //send register request to backend
    const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword
      })
    });

    //read backend response
    const data = await response.json();

    //if register failed return error message
    if (!response.ok) {
      return {
        success: false,
        message: data.error
      };
    }

    //save logged in user after successful register
    setCurrentUser(data.user);

    return {
      success: true,
      user: data.user
    };

  } catch (error) {

    //server or network problem
    return {
      success: false,
      message: 'Something went wrong. Please try again.'
    };
  }
};

  const logout = async () => {

    //tell backend to destroy session
    await fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    //clear frontend user
    setCurrentUser(null);
  };

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

function useSession() {

  //get context values
  const context = useContext(SessionContext);

  //must be inside provider
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider.');
  }

  return context;
}

export { SessionProvider, useSession };