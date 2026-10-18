import React, { useState } from 'react';
import { LayoutList, FileText, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

type Visualizacao = 'TELA_ALUNO' | 'FORMULARIO_ESTUDO' | 'FORMULARIO_PEI';

interface MenuDevProps {
  atual: Visualizacao;
  onNavegar: (v: Visualizacao) => void;
}

const TELAS: { id: Visualizacao; label: string; icon: React.ReactNode }[] = [
  { id: 'TELA_ALUNO', label: 'Ficha do Aluno', icon: <LayoutList className="w-4 h-4" /> },
  { id: 'FORMULARIO_ESTUDO', label: 'Estudo de Caso', icon: <FileText className="w-4 h-4" /> },
  { id: 'FORMULARIO_PEI', label: 'PEI', icon: <ClipboardList className="w-4 h-4" /> },
];

export const MenuDev: React.FC<MenuDevProps> = ({ atual, onNavegar }) => {
  const [aberto, setAberto] = useState(true);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end">
      {aberto && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mr-2 w-52">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Telas
          </p>
          <nav className="flex flex-col gap-1">
            {TELAS.map((tela) => (
              <button
                key={tela.id}
                onClick={() => onNavegar(tela.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                  atual === tela.id
                    ? 'bg-ifpb-teal text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tela.icon}
                {tela.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      <button
        onClick={() => setAberto(!aberto)}
        className="bg-ifpb-teal text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-ifpb-tealHover transition-colors"
        title={aberto ? 'Fechar menu' : 'Abrir menu'}
      >
        {aberto ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  );
};
