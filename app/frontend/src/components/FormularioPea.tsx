
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Lock,
  ShieldAlert,
  ClipboardList,
  AlertTriangle,
  Info
} from 'lucide-react';

import type { Aluno } from '../types/estudoDeCaso';
import type { PeaResponseDTO, PerfilUsuario } from '../types/pea';
import { PeaService } from '../services/peaService';

interface DadosFormularioPea {
  objetivoGeral: string;
  metodologia: string;
  avaliacao: string;
  disciplinaId: string | null;
}

interface FormularioPeaProps {
  aluno: Aluno;
  peaExistente: PeaResponseDTO | null;
  peiId?: string;
  onSalvar: (dados: DadosFormularioPea) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

export const FormularioPea: React.FC<FormularioPeaProps> = ({
  aluno,
  peaExistente,
  peiId,
  onSalvar,
  onVoltar,
  isLoading = false
}) => {
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');

  // Mock de perfil para testes da TA3.2.
  const [perfil, setPerfil] = useState<PerfilUsuario>('Professor');

  const [abaAtiva, setAbaAtiva] = useState<
    'pedagogico' | 'anexos'
  >('pedagogico');

  const [anexos, setAnexos] = useState<PeaResponseDTO[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  // Evita exibir resultados antigos ao trocar o perfil.
  const requisicaoAtual = useRef(0);

  const isProfessor = perfil === 'Professor';

  useEffect(() => {
    setObjetivoGeral(peaExistente?.objetivoGeral ?? '');
    setMetodologia(peaExistente?.metodologia ?? '');
    setAvaliacao(peaExistente?.avaliacao ?? '');
    setDisciplinaId(peaExistente?.disciplinaId ?? '');
    setErroFormulario(null);
  }, [peaExistente, aluno.id]);

  useEffect(() => {
    return () => {
      requisicaoAtual.current += 1;
    };
  }, []);

  const alterarPerfil = (novoPerfil: PerfilUsuario) => {
    requisicaoAtual.current += 1;
    setPerfil(novoPerfil);
    setAbaAtiva('pedagogico');
    setAnexos([]);
    setErroAcesso(null);
    setCarregandoAnexos(false);
  };

  const abrirAnexos = async () => {
    setAbaAtiva('anexos');
    setAnexos([]);
    setErroAcesso(null);

    if (!peiId) {
      setErroAcesso(
        'Não há um PEI associado para consultar os anexos.'
      );
      return;
    }

    const numeroRequisicao = ++requisicaoAtual.current;
    setCarregandoAnexos(true);

    try {
      const resultado = await PeaService.listarAnexosSensiveis(
        peiId,
        perfil
      );

      if (numeroRequisicao !== requisicaoAtual.current) {
        return;
      }

      setAnexos(resultado);
    } catch (erro: unknown) {
      if (numeroRequisicao !== requisicaoAtual.current) {
        return;
      }

      const resposta = erro as { status?: number };

      if (resposta?.status === 403) {
        setErroAcesso(
          'Acesso negado. Você não possui permissão para visualizar esses documentos.'
        );
      } else {
        setErroAcesso(
          'Não foi possível carregar os anexos. Tente novamente.'
        );
      }
    } finally {
      if (numeroRequisicao === requisicaoAtual.current) {
        setCarregandoAnexos(false);
      }
    }
  };

  const salvarFormulario = async () => {
    setErroFormulario(null);

    if (
      !objetivoGeral.trim() ||
      !metodologia.trim() ||
      !avaliacao.trim()
    ) {
      setErroFormulario(
        'Preencha o objetivo geral, a metodologia e a avaliação.'
      );
      return;
    }

    const disciplina = disciplinaId.trim();

    if (
      disciplina &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(disciplina)
    ) {
      setErroFormulario('Informe um UUID válido para a disciplina.');
      return;
    }

    await onSalvar({
      objetivoGeral: objetivoGeral.trim(),
      metodologia: metodologia.trim(),
      avaliacao: avaliacao.trim(),
      disciplinaId: disciplina || null
    });
  };

  const estiloCampo =
    'w-full p-3 border border-gray-300 rounded-lg text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight ' +
    'focus:border-ifpb-teal';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="p-2 rounded-full hover:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {peaExistente ? 'Editar PEA' : 'Novo PEA'}
            </h2>

            <p className="text-xs text-green-100 mt-1">
              Plano de Ensino Adaptado — {aluno.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Perfil simulado */}
      <div className="bg-gray-50 border-b p-5 space-y-2">
        <label
          htmlFor="perfil-pea"
          className="text-sm font-bold text-gray-700"
        >
          Perfil do usuário (simulação)
        </label>

        <select
          id="perfil-pea"
          value={perfil}
          onChange={(e) =>
            alterarPerfil(e.target.value as PerfilUsuario)
          }
          className="block w-full sm:w-64 p-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="Professor">Professor</option>
          <option value="Coordenador">Coordenador</option>
        </select>

        <p className="text-xs text-gray-500">
          Selecione um perfil para testar as restrições de acesso.
        </p>
      </div>

      {/* Aviso para Professor */}
      {isProfessor && (
        <div className="m-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">
              Acesso restrito
            </h3>
            <p className="text-xs text-amber-700 mt-1">
              O perfil Professor pode acessar as informações
              pedagógicas, mas não possui acesso à aba de
              Laudos Médicos/Anexos.
            </p>
          </div>
        </div>
      )}

      {/* Navegação por abas */}
      <div className="flex gap-3 px-6 pt-5 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setAbaAtiva('pedagogico')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 ${
            abaAtiva === 'pedagogico'
              ? 'border-ifpb-teal text-ifpb-teal'
              : 'border-transparent text-gray-500'
          }`}
        >
          Dados Pedagógicos
        </button>

        {/* TA3.2: O usuário clica para disparar a requisição e validar a autorização no Backend */}
        <button
          type="button"
          onClick={abrirAnexos}
          disabled={isLoading}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 cursor-pointer ${
            abaAtiva === 'anexos'
              ? 'border-ifpb-teal text-ifpb-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Laudos Médicos / Anexos
        </button>
      </div>

      {/* Formulário pedagógico */}
      {abaAtiva === 'pedagogico' && (
        <div className="p-6 space-y-6">

          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Info className="w-4 h-4 text-ifpb-teal shrink-0" />
            Preencha os campos pedagógicos do Plano de Ensino Adaptado.
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pea-objetivo"
              className="text-sm font-bold text-gray-700"
            >
              Objetivo Geral *
            </label>

            <textarea
              id="pea-objetivo"
              rows={4}
              value={objetivoGeral}
              disabled={isLoading}
              onChange={(e) => setObjetivoGeral(e.target.value)}
              className={estiloCampo}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pea-metodologia"
              className="text-sm font-bold text-gray-700"
            >
              Metodologia *
            </label>

            <textarea
              id="pea-metodologia"
              rows={4}
              value={metodologia}
              disabled={isLoading}
              onChange={(e) => setMetodologia(e.target.value)}
              className={estiloCampo}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pea-avaliacao"
              className="text-sm font-bold text-gray-700"
            >
              Avaliação *
            </label>

            <textarea
              id="pea-avaliacao"
              rows={4}
              value={avaliacao}
              disabled={isLoading}
              onChange={(e) => setAvaliacao(e.target.value)}
              className={estiloCampo}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pea-disciplina"
              className="text-sm font-bold text-gray-700"
            >
              ID da Disciplina (opcional)
            </label>

            <input
              id="pea-disciplina"
              type="text"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              disabled={isLoading || !!peaExistente}
              placeholder="UUID da disciplina"
              className={estiloCampo}
            />

            {peaExistente && (
              <p className="text-xs text-gray-500">
                A edição da disciplina não está disponível neste formulário.
              </p>
            )}
          </div>

          {erroFormulario && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex gap-2"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {erroFormulario}
            </div>
          )}

          <div className="flex justify-between pt-5 border-t border-gray-200 gap-3">
            <button
              type="button"
              onClick={onVoltar}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={salvarFormulario}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-ifpb-teal text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Salvar PEA'}
            </button>
          </div>

        </div>
      )}

      {/* Anexos protegidos */}
      {abaAtiva === 'anexos' && (
        <div className="p-6 space-y-4">

          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-ifpb-teal" />
            Anexos do Plano
          </h3>

          {carregandoAnexos && (
            <p className="text-sm text-gray-600">
              Carregando anexos...
            </p>
          )}

          {erroAcesso && (
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2"
            >
              <Lock className="w-5 h-5 shrink-0" />
              {erroAcesso}
            </div>
          )}

          {!carregandoAnexos &&
            !erroAcesso &&
            anexos.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum anexo disponível.
              </p>
            )}

          {!carregandoAnexos &&
            !erroAcesso &&
            anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <p className="text-sm font-semibold text-gray-700">
                  Anexo PEA
                </p>
                <p className="text-xs text-gray-500">
                  Identificador: {anexo.id}
                </p>
              </div>
            ))}

        </div>
      )}
    </div>
  );
};
