import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Routes>
      <Route element={<LandingPage authMode={null} />} path="/" />
      <Route element={<LandingPage authMode="login" />} path="/login" />
      <Route element={<LandingPage authMode="register" />} path="/register" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
