import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage';
import StudentOwnersPage from './pages/StudentOwnersPage';
import PublicSlotPage from './pages/PublicSlotPage';
import SignedInRoute from './routes/SignedInRoute';
import WelcomeRoute from './routes/WelcomeRoute';
import TeamsPage from './pages/TeamsPage';
import CreateTeamPage from './pages/CreateTeamsPage';

//Stalbek Ulanbek uulu 261102435

function App() {
  return (
    <Routes>
      <Route element={<WelcomeRoute mode={null} />} path="/" />
      <Route element={<WelcomeRoute mode="login" />} path="/login" />
      <Route element={<WelcomeRoute mode="register" />} path="/register" />
      <Route element={<PublicSlotPage />} path="/booking" />

      <Route element={<SignedInRoute />}>
        <Route element={<DashboardLayout />} path="/app">
          <Route element={<Navigate replace to="/app/dashboard" />} index />
          <Route element={<DashboardPage />} path="dashboard" />
          <Route element={<OwnerAvailabilityPage />} path="availability" />
          <Route element={<StudentOwnersPage />} path="owners" />
          <Route element={<TeamsPage />} path="teams" />
          <Route element={<CreateTeamPage />} path="teams/create" />
        </Route>
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
