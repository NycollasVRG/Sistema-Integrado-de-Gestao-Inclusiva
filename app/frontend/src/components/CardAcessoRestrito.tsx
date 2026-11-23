import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface CardAcessoRestritoProps {
  mensagem: string;
}

export const CardAcessoRestrito: React.FC<CardAcessoRestritoProps> = ({ mensagem }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
      <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
      <h2 className="text-xl font-bold text-amber-900">Acesso Restrito</h2>
      <p className="text-sm text-amber-800">{mensagem}</p>
      <button
        type="button"
        onClick={() => navigate('/estudantes')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Gestão de Estudantes
      </button>
    </div>
  );
};
