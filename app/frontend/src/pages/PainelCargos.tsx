import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Edit3,
  HeartPulse,
  Lock,
  Plus,
  Power,
  RotateCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CargoService } from '../services/cargoService';
import { toProblem } from '../services/apiClient';
import type { NivelRestricao } from '../types/auth';
import type { CargoDTO, CargoRequestDTO } from '../types/cargo';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { ConfirmModal } from '../components/ConfirmModal';

interface PainelCargosProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

const ROTULO_NIVEL: Record<NivelRestricao, string> = {
  SUPER_RESTRICAO: 'Super Restrição',
  RESTRICAO_MODERADA: 'Restrição Moderada',
  ACESSO_FUNCIONAL: 'Acesso Funcional',
};

function gerarCodigoSugerido(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

interface ModalFormularioCargoProps {
  cargoEmEdicao: CargoDTO | null;
  salvando: boolean;
  erroFormulario: string | null;
  onFechar: () => void;
  onSalvar: (payload: CargoRequestDTO) => Promise<void>;
}

const ModalFormularioCargo: React.FC<ModalFormularioCargoProps> = ({
  cargoEmEdicao,
  salvando,
  erroFormulario,
  onFechar,
  onSalvar,
}) => {
  const editando = cargoEmEdicao !== null;
  const ehSistema = Boolean(cargoEmEdicao?.sistema);

  const [nome, setNome] = useState(cargoEmEdicao?.nome ?? '');
  const [codigo, setCodigo] = useState(cargoEmEdicao?.codigo ?? '');
  const [codigoEditadoManualmente, setCodigoEditadoManualmente] = useState(editando);
  const [descricao, setDescricao] = useState(cargoEmEdicao?.descricao ?? '');
  const [nivelRestricaoPadrao, setNivelRestricaoPadrao] = useState<NivelRestricao>(
    cargoEmEdicao?.nivelRestricaoPadrao ?? 'ACESSO_FUNCIONAL',
  );
  const [autorizacaoSaudePadrao, setAutorizacaoSaudePadrao] = useState(
    cargoEmEdicao?.autorizacaoSaudePadrao ?? false,
  );
  const [ativo, setAtivo] = useState(cargoEmEdicao?.ativo ?? true);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  useEffect(() => {
    const aoPressionarEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !salvando) {
        onFechar();
      }
    };
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoPressionarEsc);
    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener('keydown', aoPressionarEsc);
    };
  }, [salvando, onFechar]);

  const handleNomeChange = (valor: string) => {
    setNome(valor);
    if (!editando && !codigoEditadoManualmente) {
      setCodigo(gerarCodigoSugerido(valor));
    }
  };

  const handleCodigoChange = (valor: string) => {
    setCodigoEditadoManualmente(true);
    setCodigo(valor.toUpperCase().replace(/[^A-Z0-9_\s-]/g, ''));
  };

  const handleSubmit = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroLocal(null);

    const nomeLimpo = nome.trim();
    const codigoLimpo = codigo.trim();

    if (nomeLimpo.length < 2) {
      setErroLocal('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (codigoLimpo.length < 2 || !/^[A-Za-z][A-Za-z0-9_\s-]{1,49}$/.test(codigoLimpo)) {
      setErroLocal(
        'O código deve iniciar com letra, ter entre 2 e 50 caracteres e conter apenas letras, números, espaços, hífen ou sublinhado.',
      );
      return;
    }

    await onSalvar({
      codigo: codigoLimpo,
      nome: nomeLimpo,
      descricao: descricao.trim() || null,
      nivelRestricaoPadrao,
      autorizacaoSaudePadrao,
      ativo: ehSistema ? true : ativo,
    });
  };

  const mensagemErro = erroLocal ?? erroFormulario;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cargo-titulo"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!salvando) onFechar();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-ifpb-tealLight text-ifpb-teal">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-cargo-titulo" className="text-base font-bold text-gray-900">
                {editando ? 'Editar Cargo' : 'Novo Cargo'}
              </h2>
              <p className="text-xs text-gray-500">
                {ehSistema
                  ? 'Cargo estrutural do sistema: nome, descrição e padrões de acesso podem ser ajustados.'
                  : 'Defina identificação, atribuições e perfil padrão de sigilo LGPD.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar formulário de cargo"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mensagemErro && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{mensagemErro}</span>
            </div>
          )}

          <div>
            <label htmlFor="cargo-nome" className="block text-xs font-semibold text-gray-700 mb-1">
              Nome do Cargo <span className="text-red-500">*</span>
            </label>
            <input
              id="cargo-nome"
              type="text"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              maxLength={100}
              required
              placeholder="Ex.: Intérprete de Libras"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal"
            />
          </div>

          <div>
            <label htmlFor="cargo-codigo" className="block text-xs font-semibold text-gray-700 mb-1">
              Código Identificador <span className="text-red-500">*</span>
            </label>
            <input
              id="cargo-codigo"
              type="text"
              value={codigo}
              onChange={(e) => handleCodigoChange(e.target.value)}
              maxLength={50}
              required
              disabled={ehSistema}
              placeholder="Ex.: INTERPRETE_LIBRAS"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal ${
                ehSistema ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {ehSistema
                ? 'O código de cargos estruturais é protegido para manter a integridade do RBAC.'
                : 'Normalizado automaticamente em MAIÚSCULAS_COM_SUBLINHADO no servidor.'}
            </p>
          </div>

          <div>
            <label htmlFor="cargo-descricao" className="block text-xs font-semibold text-gray-700 mb-1">
              Descrição / Atribuições
            </label>
            <textarea
              id="cargo-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Descreva as responsabilidades e o escopo de atuação deste cargo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal resize-y"
            />
          </div>

          <div>
            <label htmlFor="cargo-nivel" className="block text-xs font-semibold text-gray-700 mb-1">
              Nível de Restrição Padrão (LGPD) <span className="text-red-500">*</span>
            </label>
            <select
              id="cargo-nivel"
              value={nivelRestricaoPadrao}
              onChange={(e) => setNivelRestricaoPadrao(e.target.value as NivelRestricao)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal"
            >
              <option value="ACESSO_FUNCIONAL">Acesso Funcional (acompanhamento pedagógico)</option>
              <option value="RESTRICAO_MODERADA">Restrição Moderada (dados sensíveis e triagem)</option>
              <option value="SUPER_RESTRICAO">Super Restrição (gestão ampliada)</option>
            </select>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autorizacaoSaudePadrao}
                onChange={(e) => setAutorizacaoSaudePadrao(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-ifpb-teal focus:ring-ifpb-teal"
              />
              <span className="text-xs text-gray-700">
                <strong className="font-semibold text-gray-900">Autorização padrão de saúde</strong>
                <span className="block text-gray-500">
                  Indica que este cargo normalmente possui acesso a informações clínicas e de sigilo médico.
                </span>
              </span>
            </label>

            {editando && (
              <label
                className={`flex items-start gap-2.5 select-none ${
                  ehSistema ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ehSistema ? true : ativo}
                  disabled={ehSistema}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-ifpb-teal focus:ring-ifpb-teal"
                />
                <span className="text-xs text-gray-700">
                  <strong className="font-semibold text-gray-900">Cargo ativo no catálogo</strong>
                  <span className="block text-gray-500">
                    {ehSistema
                      ? 'Cargos estruturais do sistema permanecem sempre ativos.'
                      : 'Cargos inativos ficam ocultos em listagens de seleção ativa.'}
                  </span>
                </span>
              </label>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-xs cursor-pointer disabled:opacity-60"
            >
              {salvando && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Cargo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PainelCargos: React.FC<PainelCargosProps> = ({ onNotificar }) => {
  const { podeGerirCargos } = useAuth();

  const [cargos, setCargos] = useState<CargoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [cargoEmEdicao, setCargoEmEdicao] = useState<CargoDTO | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const [cargoParaExcluir, setCargoParaExcluir] = useState<CargoDTO | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [alternandoStatusId, setAlternandoStatusId] = useState<string | null>(null);

  const carregarCargos = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await CargoService.listar(undefined, signal);
      setCargos(lista);
    } catch (falha: unknown) {
      if (signal?.aborted) return;
      const prob = toProblem(falha, 'Erro ao carregar cargos', 'Não foi possível listar os cargos cadastrados.');
      setErro(prob.detail);
    } finally {
      if (!signal?.aborted) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!podeGerirCargos) return;
    const controlador = new AbortController();
    CargoService.listar(undefined, controlador.signal)
      .then((lista) => {
        if (!controlador.signal.aborted) {
          setCargos(lista);
          setErro(null);
        }
      })
      .catch((falha: unknown) => {
        if (controlador.signal.aborted) return;
        const prob = toProblem(falha, 'Erro ao carregar cargos', 'Não foi possível listar os cargos cadastrados.');
        setErro(prob.detail);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [podeGerirCargos]);

  const stats = useMemo(() => {
    const total = cargos.length;
    const ativos = cargos.filter((c) => c.ativo).length;
    const personalizados = cargos.filter((c) => !c.sistema).length;
    return { total, ativos, personalizados };
  }, [cargos]);

  const cargosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cargos.filter((c) => {
      const atendeBusca =
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        c.codigo.toLowerCase().includes(termo) ||
        (c.descricao ?? '').toLowerCase().includes(termo);

      const atendeNivel = filtroNivel === 'TODOS' || c.nivelRestricaoPadrao === filtroNivel;

      const atendeStatus =
        filtroStatus === 'TODOS' ||
        (filtroStatus === 'ATIVOS' && c.ativo) ||
        (filtroStatus === 'INATIVOS' && !c.ativo);

      return atendeBusca && atendeNivel && atendeStatus;
    });
  }, [cargos, busca, filtroNivel, filtroStatus]);

  const abrirModalNovo = () => {
    setCargoEmEdicao(null);
    setErroFormulario(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (cargo: CargoDTO) => {
    setCargoEmEdicao(cargo);
    setErroFormulario(null);
    setModalAberto(true);
  };

  const handleSalvarCargo = async (payload: CargoRequestDTO) => {
    setSalvando(true);
    setErroFormulario(null);
    setFeedback(null);
    try {
      if (cargoEmEdicao) {
        const atualizado = await CargoService.atualizar(cargoEmEdicao.id, payload);
        setCargos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
        const msg = `Cargo "${atualizado.nome}" (${atualizado.codigo}) atualizado com sucesso.`;
        setFeedback({ tipo: 'sucesso', texto: msg });
        onNotificar?.('sucesso', 'Cargo Atualizado', msg);
      } else {
        const criado = await CargoService.criar(payload);
        setCargos((prev) => [...prev, criado]);
        const msg = `Cargo "${criado.nome}" (${criado.codigo}) criado com sucesso.`;
        setFeedback({ tipo: 'sucesso', texto: msg });
        onNotificar?.('sucesso', 'Cargo Criado', msg);
      }
      setModalAberto(false);
      setCargoEmEdicao(null);
    } catch (falha: unknown) {
      const prob = toProblem(falha, 'Erro ao salvar cargo', 'Não foi possível salvar os dados do cargo.');
      setErroFormulario(prob.detail);
      onNotificar?.('erro', prob.title, prob.detail);
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (cargo: CargoDTO) => {
    setAlternandoStatusId(cargo.id);
    setFeedback(null);
    try {
      const atualizado = await CargoService.alterarStatus(cargo.id, !cargo.ativo);
      setCargos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
      const msg = atualizado.ativo
        ? `Cargo "${atualizado.nome}" reativado com sucesso.`
        : `Cargo "${atualizado.nome}" desativado com sucesso.`;
      setFeedback({ tipo: 'sucesso', texto: msg });
      onNotificar?.('sucesso', 'Status Atualizado', msg);
    } catch (falha: unknown) {
      const prob = toProblem(falha, 'Falha ao alterar status', 'Não foi possível alterar o status do cargo.');
      setFeedback({ tipo: 'erro', texto: prob.detail });
      onNotificar?.('erro', prob.title, prob.detail);
    } finally {
      setAlternandoStatusId(null);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!cargoParaExcluir) return;
    setExcluindo(true);
    setFeedback(null);
    try {
      await CargoService.excluir(cargoParaExcluir.id);
      setCargos((prev) => prev.filter((c) => c.id !== cargoParaExcluir.id));
      const msg = `Cargo "${cargoParaExcluir.nome}" (${cargoParaExcluir.codigo}) excluído com sucesso.`;
      setFeedback({ tipo: 'sucesso', texto: msg });
      onNotificar?.('sucesso', 'Cargo Excluído', msg);
      setCargoParaExcluir(null);
    } catch (falha: unknown) {
      const prob = toProblem(falha, 'Falha ao excluir cargo', 'Não foi possível excluir o cargo selecionado.');
      setFeedback({ tipo: 'erro', texto: prob.detail });
      onNotificar?.('erro', prob.title, prob.detail);
    } finally {
      setExcluindo(false);
    }
  };

  if (!podeGerirCargos) {
    return (
      <CardAcessoRestrito mensagem="Esta área é exclusiva para Administradores e Coordenadores da CLAI." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-ifpb-teal font-semibold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Administração e Coordenação</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Gestão de Cargos</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Cadastre, edite e organize os cargos institucionais e seus padrões de acesso LGPD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void carregarCargos()}
            disabled={carregando}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ifpb-teal transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>

          <button
            type="button"
            onClick={abrirModalNovo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-xs focus:outline-none focus:ring-2 focus:ring-ifpb-teal transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cargo
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-ifpb-tealLight text-ifpb-teal rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Total de Cargos</span>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Cargos Ativos</span>
            <p className="text-2xl font-bold text-emerald-700">{stats.ativos}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Personalizados</span>
            <p className="text-2xl font-bold text-blue-700">{stats.personalizados}</p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-sm flex items-start space-x-3 border ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {feedback.tipo === 'sucesso' ? 'Operação Concluída' : 'Atenção'}
            </p>
            <p className="text-xs opacity-95 mt-0.5">{feedback.texto}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código ou descrição..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            aria-label="Filtrar por nível de restrição"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-teal"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="SUPER_RESTRICAO">Super Restrição</option>
            <option value="RESTRICAO_MODERADA">Restrição Moderada</option>
            <option value="ACESSO_FUNCIONAL">Acesso Funcional</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as 'TODOS' | 'ATIVOS' | 'INATIVOS')}
            aria-label="Filtrar por status"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-teal"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVOS">Apenas Ativos</option>
            <option value="INATIVOS">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {carregando && (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mx-auto" />
            <p className="text-sm">Carregando cargos...</p>
          </div>
        )}

        {erro && !carregando && (
          <div className="p-8 text-center text-red-700 space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-semibold">{erro}</p>
            <button
              type="button"
              onClick={() => void carregarCargos()}
              className="mt-2 text-xs text-ifpb-teal font-bold hover:underline cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && cargosFiltrados.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">Nenhum cargo encontrado para os critérios informados.</p>
          </div>
        )}

        {!carregando && !erro && cargosFiltrados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Cargo</th>
                  <th scope="col" className="px-6 py-3.5">Origem</th>
                  <th scope="col" className="px-6 py-3.5">Nível Padrão</th>
                  <th scope="col" className="px-6 py-3.5">Saúde</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargosFiltrados.map((cargo) => (
                  <tr
                    key={cargo.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      !cargo.ativo ? 'bg-gray-50/80 opacity-80' : ''
                    }`}
                  >
                    <td className="px-6 py-4 max-w-md">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900">{cargo.nome}</span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {cargo.codigo}
                          </span>
                        </div>
                        {cargo.descricao && (
                          <p className="text-xs text-gray-500 line-clamp-2">{cargo.descricao}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {cargo.sistema ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                          Sistema
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Personalizado
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                          cargo.nivelRestricaoPadrao === 'SUPER_RESTRICAO'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : cargo.nivelRestricaoPadrao === 'RESTRICAO_MODERADA'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {cargo.nivelRestricaoPadrao === 'SUPER_RESTRICAO' && <Lock className="w-3 h-3" />}
                        {cargo.nivelRestricaoPadrao === 'RESTRICAO_MODERADA' && <Shield className="w-3 h-3" />}
                        {ROTULO_NIVEL[cargo.nivelRestricaoPadrao] ?? cargo.nivelRestricaoPadrao}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {cargo.autorizacaoSaudePadrao ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                          Autorizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-100">
                          Padrão restrito
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {cargo.ativo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(cargo)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                          title="Editar cargo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>

                        {!cargo.sistema && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleAlternarStatus(cargo)}
                              disabled={alternandoStatusId === cargo.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                              title={cargo.ativo ? 'Desativar cargo' : 'Reativar cargo'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {cargo.ativo ? 'Desativar' : 'Ativar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setCargoParaExcluir(cargo)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
                              title="Excluir cargo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar */}
      {modalAberto && (
        <ModalFormularioCargo
          key={cargoEmEdicao?.id ?? 'novo-cargo'}
          cargoEmEdicao={cargoEmEdicao}
          salvando={salvando}
          erroFormulario={erroFormulario}
          onFechar={() => {
            if (!salvando) {
              setModalAberto(false);
              setCargoEmEdicao(null);
            }
          }}
          onSalvar={handleSalvarCargo}
        />
      )}

      {/* Modal Confirmação Exclusão */}
      {cargoParaExcluir && (
        <ConfirmModal
          titulo="Excluir Cargo"
          mensagem={`Tem certeza que deseja excluir o cargo "${cargoParaExcluir.nome}" (${cargoParaExcluir.codigo})?`}
          textoConfirmar="Sim, Excluir Cargo"
          textoCancelar="Cancelar"
          variante="perigo"
          isLoading={excluindo}
          onConfirmar={handleConfirmarExclusao}
          onCancelar={() => setCargoParaExcluir(null)}
        />
      )}
    </div>
  );
};

export default PainelCargos;
