import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Layout route: exige sessão validada; caso contrário redireciona para o login (/login). */
export const RotaProtegida: React.FC = () => {
  const { autenticado, verificandoSessao } = useAuth();

  if (verificandoSessao) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal" />
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
