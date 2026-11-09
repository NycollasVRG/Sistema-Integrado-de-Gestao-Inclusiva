// Camada de compatibilidade da US12: a sessão agora é global (AuthContext) e
// persistida em localStorage por authSessao.ts. O JWT é enviado automaticamente
// pelo apiClient; estas funções mantêm a API usada pelos serviços da US12.
import type { SessaoUsuario } from '../types/auth';
import { autenticar } from './authService';
import { lerSessao, limparSessao, obterToken } from './authSessao';

export type SessaoGestaoEstudantes = SessaoUsuario;

export const obterTokenGestao = obterToken;
export const obterSessaoGestao = lerSessao;
export const sairGestao = limparSessao;
export const entrarGestao = autenticar;
