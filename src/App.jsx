import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import SignedInRoute from './components/SignedInRoute';
import WelcomeRoute from './components/WelcomeRoute';
import DashboardPage from './pages/DashboardPage';
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage';
import StudentBookingsPage from './pages/StudentBookingsPage';
import StudentOwnersPage from './pages/StudentOwnersPage';

function App() {
  return (
    <Routes>
      <Route element={<WelcomeRoute mode={null} />} path="/" />
      <Route element={<WelcomeRoute mode="login" />} path="/login" />
      <Route element={<WelcomeRoute mode="register" />} path="/register" />

      <Route element={<SignedInRoute />}>
        <Route element={<DashboardLayout />} path="/app">
          <Route element={<Navigate replace to="/app/dashboard" />} index />
          <Route element={<DashboardPage />} path="dashboard" />
          <Route element={<OwnerAvailabilityPage />} path="availability" />
          <Route element={<StudentOwnersPage />} path="owners" />
          <Route element={<StudentBookingsPage />} path="bookings" />
        </Route>
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
