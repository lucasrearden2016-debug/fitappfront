import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute() {
  const { token, onboarded } = useSelector((s) => s.auth);
  const { pathname } = useLocation();

  if (!token) return <Navigate to="/login" replace />;
  if (!onboarded && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
