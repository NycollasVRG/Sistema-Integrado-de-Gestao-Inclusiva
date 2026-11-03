// Integração da US12 com o JWT real emitido pelo Backend SIGI-CLAI.
// O token fica apenas em memória: ao atualizar o navegador, é preciso autenticar novamente.
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface SessaoGestaoEstudantes {
  token: string;
  tipoToken: string;
  userId: string;
  nome: string;
  email: string;
  role: string;
  nivelRestricao: string;
  autorizacaoSaude: boolean;
  tokenVersion: number;
}

let sessaoAtual: SessaoGestaoEstudantes | null = null;

export function obterTokenGestao(): string | null {
  return sessaoAtual?.token ?? null;
}

export function obterSessaoGestao(): SessaoGestaoEstudantes | null {
  return sessaoAtual;
}

export function sairGestao(): void {
  sessaoAtual = null;
}

export async function entrarGestao(email: string, senha: string): Promise<SessaoGestaoEstudantes> {
  const resposta = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), senha }),
  });

  if (!resposta.ok) {
    let mensagem = `Não foi possível entrar (HTTP ${resposta.status}).`;
    try {
      const erro: unknown = await resposta.json();
      if (erro && typeof erro === 'object') {
        const detalhe = (erro as { detail?: unknown; title?: unknown }).detail;
        if (typeof detalhe === 'string' && detalhe.trim()) mensagem = detalhe;
      }
    } catch { /* A API pode retornar uma resposta sem JSON. */ }
    throw new Error(mensagem);
  }

  const dados: unknown = await resposta.json();
  if (!dados || typeof dados !== 'object') {
    throw new Error('A API retornou uma resposta de login inválida.');
  }
  const sessao = dados as SessaoGestaoEstudantes;
  if (typeof sessao.token !== 'string' || !sessao.token.trim()) {
    throw new Error('A resposta de login não contém o token JWT.');
  }
  sessaoAtual = sessao;
  return sessao;
}
