/**
 * Feature flags do frontend.
 *
 * VITE_USE_LOCAL_FALLBACK=true habilita o fallback em localStorage SOMENTE
 * quando o backend está indisponível (rede/503), útil para demonstrações
 * offline. O padrão é `false`: erros da API são sempre exibidos ao usuário
 * e nunca mascarados como sucesso local.
 */
export const USE_LOCAL_FALLBACK: boolean =
  import.meta.env.VITE_USE_LOCAL_FALLBACK === 'true';

/**
 * URL base da API do backend.
 * Por padrão utiliza '/api' (roteado pelo proxy reverso do Nginx no Docker
 * ou pelo proxy do Vite em desenvolvimento local).
 */
export const API_URL: string = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

