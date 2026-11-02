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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-modal-inativar"
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <h2 id="titulo-modal-inativar" className="text-xl font-bold text-[#0F6460]">Inativar estudante</h2>
          <button type="button" onClick={aoFechar} disabled={processando} aria-label="Fechar confirmação"
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-700">Você está alterando o status de <strong>{estudante.nomeCompleto}</strong> ({estudante.matricula}). O histórico não será apagado.</p>
        <label className="block text-sm font-medium text-gray-700">Situação após confirmação
          <select value={status} onChange={(e) => setStatus(e.target.value as 'INATIVO' | 'EVADIDO')}
            className="block mt-1 w-full border border-gray-300 rounded-lg p-2.5 bg-white">
            <option value="INATIVO">Inativo</option>
            <option value="EVADIDO">Evadido</option>
          </select>
        </label>
        {erro && <p role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{erro}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={aoFechar} disabled={processando} className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={confirmar} disabled={processando}
            className="rounded-lg px-4 py-2 text-sm font-semibold bg-red-700 text-white disabled:opacity-50">
            {processando ? 'Confirmando...' : 'Confirmar inativação'}
          </button>
        </div>
      </section>
    </div>
  );
}
