import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardPlus,
  FileText,
  GraduationCap,
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
        setErro('Não foi possível carregar a lista resumida de estudantes agora.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  const emTriagem = useMemo(
    () => estudantes.filter((e) => e.status === 'EM_TRIAGEM').length,
    [estudantes],
  );

  if (!sessao) return null;

  return (
    <div className="space-y-6">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={GraduationCap}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      {/* Indicadores do Docente */}
      <section aria-label="Resumo docente" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardResumoKpi
          titulo="Estudantes Acompanhados"
          valor={totalEstudantes ?? '—'}
          descricao="Discentes ativos com orientações pedagógicas disponíveis"
          icone={Users}
          tom="teal"
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Em Triagem (Recentes)"
          valor={emTriagem}
          descricao="Estudantes desta amostra aguardando análise da CLAI"
          icone={BookOpen}
          tom={emTriagem > 0 ? 'amber' : 'green'}
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Escopo de Sigilo LGPD"
          valor="Pedagógico"
          descricao="Acesso funcional a PEAs e adaptações, com sigilo clínico protegido"
          icone={Lock}
          tom="slate"
        />
      </section>

      {/* Ações Principais do Professor */}
      <section aria-label="Ferramentas do professor">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Ferramentas Pedagógicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardAcaoRapida
            titulo="Adaptação DUA de Provas"
            descricao="Envie sua avaliação, gere sugestões com IA baseadas nas necessidades do estudante e baixe a versão adaptada."
            to="/adaptacao-dua"
            icone={FileText}
            badge="IA Assistiva"
          />
          <CardAcaoRapida
            titulo="Indicar Estudante à CLAI"
            descricao="Identificou dificuldades em sala? Encaminhe uma demanda espontânea com justificativa e disciplinas observadas."
            to="/indicacoes/nova"
            icone={ClipboardPlus}
            destaque="green"
          />
          <CardAcaoRapida
            titulo="Consultar Estudantes e PEAs"
            descricao="Acesse o catálogo de estudantes para consultar orientações pedagógicas e registrar Planos de Ensino Adaptados."
            to="/estudantes"
            icone={Users}
          />
        </div>
      </section>

      {/* Lista Rápida de Estudantes */}
      <ListaEstudantesRapida
        titulo="Acesso Rápido aos Estudantes"
        subtitulo="Filtre rapidamente e abra o prontuário pedagógico ou PEA do discente"
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
