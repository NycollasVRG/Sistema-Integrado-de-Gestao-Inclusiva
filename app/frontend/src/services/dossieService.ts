import { apiFetch, type ApiProblem } from './apiClient';
import type { DossieJuridicoDTO, EscopoDossie } from '../types/dossie';

function endpointExportar(alunoId: string, escopo: EscopoDossie): string {
  return `/api/alunos/${encodeURIComponent(alunoId)}/dossie/exportar?escopo=${escopo}`;
}

function validarEntrada(alunoId: string): void {
  if (!alunoId) {
    const problema: ApiProblem = {
      title: 'Dados do Aluno Ausentes',
      status: 400,
      detail: 'É necessário selecionar um estudante antes de exportar o dossiê.',
    };
    throw problema;
  }
}

/** Extrai o nome sugerido pelo backend no cabeçalho Content-Disposition. */
function nomeArquivo(res: Response, escopo: EscopoDossie, matricula?: string): string {
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const simples = /filename="?([^";]+)"?/i.exec(disposition);
    const bruto = utf8?.[1] ?? simples?.[1];
    if (bruto) {
      try {
        return decodeURIComponent(bruto.trim());
      } catch {
        return bruto.trim();
      }
    }
  }
  const matriculaLimpa = (matricula || 'aluno').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `dossie_${matriculaLimpa}_${escopo.toLowerCase()}.json`;
}

export const DossieService = {
  /**
   * Consulta o dossiê sem disparar download (útil para futuros visualizadores).
   * A mesma rota de exportação é reutilizada; o Content-Disposition é ignorado aqui.
   */
  async consultar(
    alunoId: string,
    escopo: EscopoDossie,
    signal?: AbortSignal
  ): Promise<DossieJuridicoDTO> {
    validarEntrada(alunoId);
    const res = await apiFetch(endpointExportar(alunoId, escopo), { signal });
    return (await res.json()) as DossieJuridicoDTO;
  },

  /**
   * TA6.2 / TA6.4: chama GET /api/alunos/{id}/dossie/exportar via apiFetch, converte a
   * resposta em Blob e dispara o download do arquivo real gerado pelo servidor.
   * O JSON é lido antes do Blob para alimentar o toast com protocolo e contadores.
   */
  async exportar(alunoId: string, escopo: EscopoDossie): Promise<DossieJuridicoDTO> {
    validarEntrada(alunoId);

    const res = await apiFetch(endpointExportar(alunoId, escopo));
    const dossie = (await res.clone().json()) as DossieJuridicoDTO;
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo(res, escopo, dossie.matricula);
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    return dossie;
  },
};
