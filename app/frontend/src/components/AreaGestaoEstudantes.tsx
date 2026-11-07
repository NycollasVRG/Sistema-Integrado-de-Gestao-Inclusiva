import { GestaoEstudantes } from '../pages/GestaoEstudantes';
import type { EstudanteResumo } from '../types/gestaoEstudantes';

interface Props {
  onAbrirProntuario: (estudante: EstudanteResumo) => void;
}

// A autenticação agora é global (AuthContext + rota protegida em App.tsx).
export function AreaGestaoEstudantes({ onAbrirProntuario }: Props) {
  return <GestaoEstudantes onAbrirProntuario={onAbrirProntuario} />;
}
