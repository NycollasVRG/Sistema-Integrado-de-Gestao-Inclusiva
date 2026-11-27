import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPlus, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { EstudanteResumo } from '../../types/gestaoEstudantes';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { ListaEstudantesRapida } from '../../components/inicio/ListaEstudantesRapida';

interface InicioProfessorProps {
  onAbrirProntuario?: (estudante: EstudanteResumo) => void;
}

export const InicioProfessor: React.FC<InicioProfessorProps> = ({ onAbrirProntuario }) => {
  const { sessao } = useAuth();
  const [estudantes, setEstudantes] = useState<EstudanteResumo[]>([]);
  const [totalEstudantes, setTotalEstudantes] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [revisao, setRevisao] = useState(0);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    setRevisao((v) => v + 1);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    GestaoEstudantesService.listar(
      { termo: '', curso: '', turma: '', tag: '', ativo: true, page: 0, size: 8 },
      controlador.signal,
    )
      .then((pagina) => {
        if (controlador.signal.aborted) return;
        setEstudantes(pagina.content);
        setTotalEstudantes(pagina.totalElements);
      })
      .catch(() => {
        if (controlador.signal.aborted) return;
        setErro('Não foi possível carregar os estudantes no momento.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  if (!sessao) return null;

  const subtituloLista =
    totalEstudantes !== null
      ? `${totalEstudantes} estudante(s) em acompanhamento`
      : 'Acesse rapidamente o prontuário ou PEA do estudante';

  return (
    <div className="space-y-5">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={GraduationCap}
        carregando={carregando}
        onAtualizar={recarregar}
        acaoExtra={
          <Link
            to="/indicacoes/nova"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ifpb-teal hover:bg-ifpb-tealHover px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <ClipboardPlus className="w-3.5 h-3.5" />
            Indicar estudante
          </Link>
        }
      />

      <ListaEstudantesRapida
        titulo="Estudantes em Acompanhamento"
        subtitulo={subtituloLista}
        estudantes={estudantes}
        carregando={carregando}
        erro={erro}
        mostrarBuscaLocal
        onAbrirProntuario={onAbrirProntuario}
      />
    </div>
  );
};

export default InicioProfessor;
