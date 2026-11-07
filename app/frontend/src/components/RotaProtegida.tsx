import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Layout route: exige sessão ativa; caso contrário redireciona ao /login. */
export const RotaProtegida: React.FC = () => {
  const { autenticado } = useAuth();
  const location = useLocation();
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};
