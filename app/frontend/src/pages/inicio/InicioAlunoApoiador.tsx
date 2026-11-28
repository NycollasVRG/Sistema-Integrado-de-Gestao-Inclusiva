import React, { useCallback, useEffect, useState } from 'react';
import { HandHeart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { EstudanteResumo } from '../../types/gestaoEstudantes';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { ListaEstudantesRapida } from '../../components/inicio/ListaEstudantesRapida';

interface InicioAlunoApoiadorProps {
  onAbrirProntuario?: (estudante: EstudanteResumo) => void;
}

export const InicioAlunoApoiador: React.FC<InicioAlunoApoiadorProps> = ({
  onAbrirProntuario,
}) => {
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
      ? `${totalEstudantes} estudante(s) disponíveis para consulta`
      : 'Pesquise e acesse as orientações pedagógicas';

  return (
    <div className="space-y-5">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={HandHeart}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      <ListaEstudantesRapida
        titulo="Estudantes Acompanhados"
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

export default InicioAlunoApoiador;
