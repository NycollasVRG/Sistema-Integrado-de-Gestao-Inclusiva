import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Search,
  UserX,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Shield,
  HeartPulse,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminUsuariosService } from '../services/adminUsuariosService';
import type { UsuarioAdminDTO } from '../types/adminUsuarios';
import { ROTULO_ROLE } from '../types/auth';
import { ConfirmModal } from '../components/ConfirmModal';
import { toProblem } from '../services/apiClient';

interface PainelAdminUsuariosProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

export const PainelAdminUsuarios: React.FC<PainelAdminUsuariosProps> = ({ onNotificar }) => {
  const { isAdmin, sessao } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioAdminDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'REVOGADOS'>('TODOS');

  // Controle de modal de revogação
  const [usuarioParaRevogar, setUsuarioParaRevogar] = useState<UsuarioAdminDTO | null>(null);
  const [revogando, setRevogando] = useState(false);

  // Alerta local de feedback
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarUsuarios = async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await AdminUsuariosService.listarUsuarios(signal);
      setUsuarios(lista);
    } catch (falha: unknown) {
      if (signal?.aborted) return;
      const prob = toProblem(falha, 'Erro ao carregar usuários', 'Não foi possível listar os usuários cadastrados.');
      setErro(prob.detail);
    } finally {
      if (!signal?.aborted) setCarregando(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const controlador = new AbortController();
    carregarUsuarios(controlador.signal);
    return () => controlador.abort();
  }, [isAdmin]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.acessoAtivo).length;
    const revogados = total - ativos;
    return { total, ativos, revogados };
  }, [usuarios]);

  // Lista filtrada por busca e seletores
  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const atendeBusca =
        !termo ||
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo);

      const atendeRole = filtroRole === 'TODOS' || u.role === filtroRole;

      const atendeStatus =
        filtroStatus === 'TODOS' ||
        (filtroStatus === 'ATIVOS' && u.acessoAtivo) ||
        (filtroStatus === 'REVOGADOS' && !u.acessoAtivo);

      return atendeBusca && atendeRole && atendeStatus;
    });
  }, [usuarios, busca, filtroRole, filtroStatus]);

  // Executa a revogação imediata (TA11.4)
  const handleConfirmarRevogacao = async () => {
    if (!usuarioParaRevogar) return;
    setRevogando(true);
    setFeedback(null);
    try {
      const resposta = await AdminUsuariosService.revogarAcesso(usuarioParaRevogar.id);

      // Atualização instantânea na tabela local (reatividade sem refresh obrigatório)
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioParaRevogar.id
            ? { ...u, acessoAtivo: false, tokenVersion: resposta.tokenVersion }
            : u
        )
      );

      const msgSucesso = `Acesso de ${usuarioParaRevogar.nome} revogado com sucesso. Todas as sessões ativas foram invalidadas (TA11.4).`;
      setFeedback({ tipo: 'sucesso', texto: msgSucesso });
      onNotificar?.('sucesso', 'Acesso Revogado com Sucesso', msgSucesso);
      setUsuarioParaRevogar(null);
    } catch (falha: unknown) {
      const prob = toProblem(falha, 'Falha ao revogar acesso', 'Não foi possível revogar o acesso do usuário.');
      setFeedback({ tipo: 'erro', texto: prob.detail });
      onNotificar?.('erro', prob.title, prob.detail);
    } finally {
      setRevogando(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-red-900">Acesso Restrito ao Painel Administrativo</h2>
        <p className="text-sm text-red-700">
          Você está conectado com o perfil <strong>{sessao?.role ?? 'Desconhecido'}</strong>. O Painel de Gestão de Acessos é exclusivo para Administradores do SIGI-CLAI (ROLE_ADMIN).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-ifpb-teal font-semibold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Módulo Administrativo &bull; US 11</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Gestão de Acessos e Usuários
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Visualize perfis RBAC, restrições LGPD e execute revogação instantânea de credenciais (TA11.4).
          </p>
        </div>

        <button
          type="button"
          onClick={() => carregarUsuarios()}
          disabled={carregando}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ifpb-teal transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Total de Usuários</span>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Vínculos Ativos</span>
            <p className="text-2xl font-bold text-emerald-700">{stats.ativos}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Acessos Revogados</span>
            <p className="text-2xl font-bold text-red-700">{stats.revogados}</p>
          </div>
        </div>
      </div>

      {/* Feedback contextual */}
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
            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal focus:border-ifpb-teal"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-teal"
          >
            <option value="TODOS">Todos os Perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="COORDENADOR">Coordenador</option>
            <option value="CLAI_PSICOPEDAGOGO">Psicopedagogo</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ALUNO_APOIADOR">Aluno Apoiador</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as 'TODOS' | 'ATIVOS' | 'REVOGADOS')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-teal"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVOS">Apenas Ativos</option>
            <option value="REVOGADOS">Apenas Revogados</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {carregando && (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mx-auto" />
            <p className="text-sm">Carregando usuários e permissões RBAC...</p>
          </div>
        )}

        {erro && !carregando && (
          <div className="p-8 text-center text-red-700 space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-semibold">{erro}</p>
            <button
              type="button"
              onClick={() => carregarUsuarios()}
              className="mt-2 text-xs text-ifpb-teal font-bold hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && usuariosFiltrados.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">Nenhum usuário encontrado para os critérios informados.</p>
          </div>
        )}

        {!carregando && !erro && usuariosFiltrados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Usuário</th>
                  <th scope="col" className="px-6 py-3.5">Perfil (Role)</th>
                  <th scope="col" className="px-6 py-3.5">Nível Restrição</th>
                  <th scope="col" className="px-6 py-3.5">Autorização Saúde</th>
                  <th scope="col" className="px-6 py-3.5">Status Vínculo</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.map((usuario) => {
                  const ehProprioUsuario = sessao?.userId === usuario.id || sessao?.email === usuario.email;

                  return (
                    <tr
                      key={usuario.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        !usuario.acessoAtivo ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Usuário (Nome e E-mail) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-ifpb-tealLight text-ifpb-teal flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {usuario.nome ? usuario.nome.slice(0, 2) : 'US'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-1.5">
                              {usuario.nome}
                              {ehProprioUsuario && (
                                <span className="text-[10px] bg-gray-200 text-gray-700 font-semibold px-1.5 py-0.5 rounded">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{usuario.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Perfil (Role) */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            usuario.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : usuario.role === 'COORDENADOR'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : usuario.role === 'CLAI_PSICOPEDAGOGO'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : usuario.role === 'PROFESSOR'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ROTULO_ROLE[usuario.role] ?? usuario.role}
                        </span>
                      </td>

                      {/* Nível de Restrição */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                            usuario.nivelRestricao === 'SUPER_RESTRICAO'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : usuario.nivelRestricao === 'RESTRICAO_MODERADA'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {usuario.nivelRestricao === 'SUPER_RESTRICAO' && <Lock className="w-3 h-3" />}
                          {usuario.nivelRestricao === 'RESTRICAO_MODERADA' && <Shield className="w-3 h-3" />}
                          {usuario.nivelRestricao}
                        </span>
                      </td>

                      {/* Autorização Saúde */}
                      <td className="px-6 py-4">
                        {usuario.autorizacaoSaude ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                            Autorizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-100">
                            Não autorizado
                          </span>
                        )}
                      </td>

                      {/* Status do Vínculo */}
                      <td className="px-6 py-4">
                        {usuario.acessoAtivo ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo (v{usuario.tokenVersion})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            Acesso Revogado (v{usuario.tokenVersion})
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 text-right">
                        {usuario.acessoAtivo ? (
                          <button
                            type="button"
                            onClick={() => setUsuarioParaRevogar(usuario)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-2xs transition-colors cursor-pointer"
                            title="Revogar credenciais e invalidar sessões"
                          >
                            <UserX className="w-3.5 h-3.5 text-red-600" />
                            Revogar Acesso
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                            title="Este acesso já foi desativado"
                          >
                            Revogado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Revogação Imediata */}
      {usuarioParaRevogar && (
        <ConfirmModal
          titulo="Revogar Acesso do Usuário"
          mensagem={`Tem certeza que deseja revogar imediatamente o acesso de "${usuarioParaRevogar.nome}" (${usuarioParaRevogar.email})? Esta ação definirá o vínculo como inativo, incrementará a versão do token (tokenVersion) e invalidará sumariamente qualquer sessão ativa do usuário no SIGI-CLAI (Critério TA11.4).`}
          textoConfirmar="Sim, Revogar Imediatamente"
          textoCancelar="Cancelar"
          variante="perigo"
          isLoading={revogando}
          onConfirmar={handleConfirmarRevogacao}
          onCancelar={() => setUsuarioParaRevogar(null)}
        />
      )}
    </div>
  );
};

export default PainelAdminUsuarios;
