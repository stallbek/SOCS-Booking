import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeedbackProvider } from './context/FeedbackContext';
import { SessionProvider } from './context/SessionContext';
import './styles.css';

//Stalbek Ulanbek uulu 261102435

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </BrowserRouter>
    </SessionProvider>
  </React.StrictMode>
);
