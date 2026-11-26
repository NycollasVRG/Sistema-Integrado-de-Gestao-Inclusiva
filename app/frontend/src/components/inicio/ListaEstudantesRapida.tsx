import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Search, Users } from 'lucide-react';
import type { EstudanteResumo } from '../../types/gestaoEstudantes';
import { BadgeStatusEstudante } from '../BadgeStatusEstudante';

interface ListaEstudantesRapidaProps {
  titulo?: string;
  subtitulo?: string;
  estudantes: EstudanteResumo[];
  carregando: boolean;
  erro?: string | null;
  mostrarBuscaLocal?: boolean;
  onAbrirProntuario?: (estudante: EstudanteResumo) => void;
}

export const ListaEstudantesRapida: React.FC<ListaEstudantesRapidaProps> = ({
  titulo = 'Estudantes em Acompanhamento',
  subtitulo = 'Acesso rápido aos prontuários ativos',
  estudantes,
  carregando,
  erro,
  mostrarBuscaLocal = false,
  onAbrirProntuario,
}) => {
  const [filtro, setFiltro] = useState('');

  const estudantesFiltrados = useMemo(() => {
    const termo = filtro.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return estudantes;
    return estudantes.filter(
      (est) =>
        est.nomeCompleto.toLocaleLowerCase('pt-BR').includes(termo) ||
        est.matricula.toLocaleLowerCase('pt-BR').includes(termo) ||
        est.curso.toLocaleLowerCase('pt-BR').includes(termo) ||
        est.turma.toLocaleLowerCase('pt-BR').includes(termo),
    );
  }, [estudantes, filtro]);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
            {titulo}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>
        </div>

        <Link
          to="/estudantes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
        >
          Ver catálogo completo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {mostrarBuscaLocal && (
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100">
          <div className="relative">
            <Search
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtrar por nome, matrícula, curso ou turma..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
            />
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {carregando ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : erro ? (
          <div className="p-5 text-sm text-amber-800 bg-amber-50/60">{erro}</div>
        ) : estudantesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {filtro.trim()
              ? 'Nenhum estudante encontrado com esse filtro.'
              : 'Nenhum estudante ativo disponível no momento.'}
          </div>
        ) : (
          estudantesFiltrados.map((est) => (
            <div
              key={est.id}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-[#F8FAF8] transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{est.nomeCompleto}</p>
                  <BadgeStatusEstudante status={est.status} ativo={est.ativo} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Matrícula {est.matricula} &bull; {est.curso}
                  {est.turma ? ` (${est.turma})` : ''}
                </p>
              </div>

              {onAbrirProntuario ? (
                <button
                  type="button"
                  onClick={() => onAbrirProntuario(est)}
                  className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-ifpb-teal bg-ifpb-tealLight hover:bg-ifpb-teal hover:text-white transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir prontuário
                </button>
              ) : (
                <Link
                  to={`/estudantes/${est.id}/prontuario`}
                  className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-ifpb-teal bg-ifpb-tealLight hover:bg-ifpb-teal hover:text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir prontuário
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
