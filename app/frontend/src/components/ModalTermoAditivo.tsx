import React, { useState } from 'react';
import { AlertTriangle, RotateCw, ScrollText } from 'lucide-react';
import { AtaService } from '../services/ataService';
import { isProblem } from '../services/apiClient';
import type { TermoAditivoResponseDTO } from '../types/ata';

interface ModalTermoAditivoProps {
  ataId: string;
  onCancelar: () => void;
  onSucesso: (termo: TermoAditivoResponseDTO) => void | Promise<void>;
}

/** Formulário exclusivo para ata FINALIZADA (TA8.4): nunca altera os campos originais. */
export const ModalTermoAditivo: React.FC<ModalTermoAditivoProps> = ({
  ataId,
  onCancelar,
  onSucesso,
}) => {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!texto.trim()) {
      setErro('Descreva o ajuste que o termo aditivo está registrando.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const termo = await AtaService.adicionarTermoAditivo(ataId, { texto: texto.trim() });
      setTexto('');
      await onSucesso(termo);
    } catch (e: unknown) {
      if (isProblem(e)) {
        setErro(
          e.termoAditivoUri
            ? `${e.detail || e.title}. Use o termo aditivo para registrar a alteração.`
            : e.detail || e.title || 'Não foi possível emitir o termo aditivo.',
        );
      } else {
        setErro('Não foi possível emitir o termo aditivo. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ifpb-teal/25 bg-ifpb-tealLight/40 p-3 text-xs text-ifpb-dark flex items-start gap-2">
        <ScrollText className="w-4 h-4 shrink-0 mt-0.5 text-ifpb-teal" />
        <span>
          A ata está finalizada e imutável. O termo aditivo registra explicações e ajustes sem
          modificar a pauta, as deliberações, os participantes ou os compromissos originais.
        </span>
      </div>

      {erro && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="break-words">{erro}</span>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="block text-xs font-bold uppercase text-ifpb-dark">Texto do termo aditivo</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          disabled={enviando}
          placeholder="Ex.: Ajuste no prazo do compromisso de adaptação de avaliação, acordado em comum acordo na reunião de acompanhamento."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y disabled:opacity-60"
        />
        <span className="block text-[11px] text-gray-500">
          {texto.trim().length} caracteres • o registro é auditado com autor e data/hora.
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={enviando || !texto.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? <RotateCw className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
          {enviando ? 'Emitindo...' : 'Emitir Termo Aditivo'}
        </button>
      </div>
    </div>
  );
};
