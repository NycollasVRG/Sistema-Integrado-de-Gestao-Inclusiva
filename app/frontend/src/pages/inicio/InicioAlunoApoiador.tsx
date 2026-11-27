import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  HandHeart,
  Info,
  Lock,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { EstudanteResumo } from '../../types/gestaoEstudantes';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { CardResumoKpi } from '../../components/inicio/CardResumoKpi';
import { CardAcaoRapida } from '../../components/inicio/CardAcaoRapida';
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
        setErro('Não foi possível carregar os estudantes acompanhados no momento.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  if (!sessao) return null;

  return (
    <div className="space-y-6">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={HandHeart}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      {/* Resumo Funcional */}
      <section aria-label="Resumo do aluno apoiador" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardResumoKpi
          titulo="Estudantes Disponíveis"
          valor={totalEstudantes ?? '—'}
          descricao="Discentes ativos no catálogo para consulta de apoio inclusivo"
          icone={Users}
          tom="teal"
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Nível de Acesso (LGPD)"
          valor="Acesso Funcional"
          descricao="Visualização limitada a orientações pedagógicas, preservando dados clínicos sigilosos"
          icone={Lock}
          tom="green"
        />
      </section>

      {/* Lista Rápida + Guia de Atuação */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ListaEstudantesRapida
            titulo="Estudantes Acompanhados"
            subtitulo="Pesquise e acesse as orientações pedagógicas autorizadas para o apoio"
            estudantes={estudantes}
            carregando={carregando}
            erro={erro}
            mostrarBuscaLocal
            onAbrirProntuario={onAbrirProntuario}
          />
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3.5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Guia do Aluno Apoiador
            </h2>
            <ul className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Consulte o prontuário funcional para conhecer as estratégias de apoio e adaptações
                  em sala de aula.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Informações familiares, socioemocionais e laudos médicos permanecem protegidos sob
                  sigilo LGPD.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Caso observe novas barreiras de aprendizagem ou situações urgentes, comunique a
                  equipe CLAI ou o docente da disciplina.
                </span>
              </li>
            </ul>
          </section>

          <CardAcaoRapida
            titulo="Catálogo de Estudantes"
            descricao="Abrir a listagem completa com filtros por curso, turma e indicadores."
            to="/estudantes"
            icone={Users}
          />
        </aside>
      </div>
    </div>
  );
};

export default InicioAlunoApoiador;
