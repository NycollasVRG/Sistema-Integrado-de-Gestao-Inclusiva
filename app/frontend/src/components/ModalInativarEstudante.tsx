import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { EstudanteResumo } from '../types/gestaoEstudantes';

interface Props {
  estudante: EstudanteResumo | null;
  aoFechar: () => void;
  aoConfirmar: (mensagem: string) => void;
}

export function ModalInativarEstudante({ estudante, aoFechar, aoConfirmar }: Props) {
  const [status, setStatus] = useState<'INATIVO' | 'EVADIDO'>('INATIVO');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!estudante) return;
    setStatus('INATIVO');
    setErro('');
  }, [estudante]);

  useEffect(() => {
    if (!estudante) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processando) {
        aoFechar();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [estudante, processando, aoFechar]);

  if (!estudante) return null;

  async function confirmar() {
    if (!estudante) return;
    setErro('');
    setProcessando(true);
    try {
      await GestaoEstudantesService.inativar(estudante.id, status);
      aoConfirmar(`Estudante marcado como ${status === 'EVADIDO' ? 'Evadido' : 'Inativo'}. O histórico permanece armazenado.`);
    } catch (falha: unknown) {
      setErro(falha instanceof Error ? falha.message : 'Erro ao atualizar o status do estudante.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity"
        onClick={() => {
          if (!processando) aoFechar();
        }}
        aria-hidden="true"
      />
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-modal-inativar"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4 z-10">
        <div className="flex justify-between items-start gap-3">
          <h2 id="titulo-modal-inativar" className="text-xl font-bold text-ifpb-teal">Inativar estudante</h2>
          <button type="button" onClick={aoFechar} disabled={processando} aria-label="Fechar confirmação"
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-700">Você está alterando o status de <strong>{estudante.nomeCompleto}</strong> ({estudante.matricula}). O histórico não será apagado.</p>
        <label className="block text-sm font-medium text-gray-700">Situação após confirmação
          <select value={status} onChange={(e) => setStatus(e.target.value as 'INATIVO' | 'EVADIDO')}
            className="block mt-1 w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal">
            <option value="INATIVO">Inativo</option>
            <option value="EVADIDO">Evadido</option>
          </select>
        </label>
        {erro && <p role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{erro}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={aoFechar} disabled={processando} className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer">Cancelar</button>
          <button type="button" onClick={confirmar} disabled={processando}
            className="rounded-lg px-4 py-2 text-sm font-semibold bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 cursor-pointer transition-colors">
            {processando ? 'Confirmando...' : 'Confirmar inativação'}
          </button>
        </div>
      </section>
    </div>
  );
}
