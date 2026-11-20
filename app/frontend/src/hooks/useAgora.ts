import { useEffect, useState } from 'react';

/**
 * Relógio reativo: re-renderiza a cada {@code intervaloMs} para que regras dependentes do tempo
 * (ex.: janela de edição de 24h) sejam reavaliadas sem recarregar a tela.
 */
export function useAgora(intervaloMs = 30_000): number {
  const [agora, setAgora] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
