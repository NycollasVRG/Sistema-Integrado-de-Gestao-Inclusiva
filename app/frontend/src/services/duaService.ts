import { apiFetch, isAbortError, isProblem, toProblem } from './apiClient';
import type {
  AdaptacaoDuaRequestDTO,
  AdaptacaoDuaResponseDTO,
  DocumentoDuaDTO,
} from '../types/dua';
import { MSG_TIMEOUT_DUA } from '../utils/dua';

/** O back-end pode levar até 30 s na IA; repetir automaticamente evita erro em picos. */
export const TENTATIVAS_PADRAO_DUA = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 1000;

export interface OpcoesAdaptacaoDua {
  signal?: AbortSignal;
  tentativas?: number;
  /** Permite à tela exibir "Tentativa 2 de 3" durante o carregamento. */
  aoStatus?: (tentativa: number, total: number) => void;
}

function ehRetentavel(erro: unknown): boolean {
  return isProblem(erro) && (erro.status === 504 || erro.status === 503);
}

function aguardar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Adaptação cancelada.', 'AbortError'));
      return;
    }
    const aoAbortar = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Adaptação cancelada.', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', aoAbortar);
      resolve();
    }, ms);
    signal?.addEventListener('abort', aoAbortar, { once: true });
  });
}

/**
 * POST /api/dua/adaptar. O request é JSON com alunoId + textoProva; as tags vêm do
 * cadastro do aluno no back-end. Em 504/503 há novas tentativas com backoff linear;
 * a última falha é devolvida como ApiProblem para a tela oferecer "Tentar novamente".
 */
export async function adaptarProvaDua(
  dto: AdaptacaoDuaRequestDTO,
  opcoes: OpcoesAdaptacaoDua = {},
): Promise<AdaptacaoDuaResponseDTO> {
  const total = Math.max(1, opcoes.tentativas ?? TENTATIVAS_PADRAO_DUA);

  for (let tentativa = 1; tentativa <= total; tentativa += 1) {
    opcoes.aoStatus?.(tentativa, total);
    try {
      const res = await apiFetch('/api/dua/adaptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        signal: opcoes.signal,
      });
      return (await res.json()) as AdaptacaoDuaResponseDTO;
    } catch (erro: unknown) {
      if (isAbortError(erro) || opcoes.signal?.aborted) throw erro;
      if (!ehRetentavel(erro) || tentativa === total) {
        if (isProblem(erro) && erro.status === 504 && !erro.detail) {
          throw { ...erro, detail: MSG_TIMEOUT_DUA };
        }
        throw erro;
      }
      await aguardar(ESPERA_ENTRE_TENTATIVAS_MS * tentativa, opcoes.signal);
    }
  }

  throw toProblem(undefined, 'Não foi possível adaptar a prova.', MSG_TIMEOUT_DUA);
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nomeArquivo(matricula: string, extensao: string): string {
  const base = (matricula || 'estudante').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const instante = new Date().toISOString().replace(/[:.]/g, '-');
  return `prova_adaptada_dua_${base}_${instante}.${extensao}`;
}

function dispararDownload(conteudo: string, mime: string, nome: string): void {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function montarHtml(documento: DocumentoDuaDTO): string {
  const cabecalho = [
    documento.estudante.nome,
    documento.estudante.matricula,
    [documento.estudante.curso, documento.estudante.turma].filter(Boolean).join(' / '),
  ]
    .filter(Boolean)
    .map((parte) => `<span>${escaparHtml(parte)}</span>`)
    .join('');

  const corpo = documento.questoes.length
    ? documento.questoes
        .map((questao) => {
          const avisos: string[] = [];
          if (questao.status === 'EDITADA') avisos.push('Revisada manualmente pelo professor.');
          if (questao.status === 'REJEITADA') {
            const motivo = questao.justificativaRejeicao
              ? ` Motivo: ${escaparHtml(questao.justificativaRejeicao)}`
              : '';
            avisos.push(`Adaptação rejeitada; enunciado original mantido.${motivo}`);
          }
          return (
            `<section class="questao"><h2>Questão ${questao.numero}</h2>` +
            `<div class="texto">${escaparHtml(questao.textoFinal)}</div>` +
            (avisos.length ? `<p class="aviso">${avisos.join(' ')}</p>` : '') +
            '</section>'
          );
        })
        .join('')
    : `<div class="texto">${escaparHtml(documento.textoFinal)}</div>`;

  const orientacoes = documento.orientacoes.length
    ? `<ul>${documento.orientacoes.map((item) => `<li>${escaparHtml(item)}</li>`).join('')}</ul>`
    : '<p>Não informadas.</p>';
  const avisoComplexidade = documento.complexidadePreservada
    ? ''
    : '<p class="aviso"><strong>Atenção:</strong> o sistema não confirmou a preservação da complexidade. Confira a prova antes de aplicá-la.</p>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Prova adaptada em DUA</title>
<style>
body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; max-width: 820px; margin: 32px auto; padding: 0 20px; line-height: 1.6; }
h1 { color: #0f6460; font-size: 22px; margin-bottom: 4px; }
h2 { color: #0f6460; font-size: 16px; margin: 0 0 8px; }
#cabecalho { border-bottom: 2px solid #0f6460; padding-bottom: 12px; margin-bottom: 24px; font-size: 13px; }
#cabecalho span { display: block; }
.questao { margin-bottom: 24px; break-inside: avoid; }
.texto { white-space: pre-wrap; font-size: 14px; }
.aviso { color: #92400e; font-size: 12px; }
#professor { border-top: 1px solid #d1d5db; margin-top: 32px; padding-top: 16px; font-size: 12px; }
.no-print { margin-bottom: 20px; padding: 10px 16px; border: 0; border-radius: 8px; background: #0f6460; color: #fff; cursor: pointer; font-size: 13px; }
@media print { .no-print { display: none; } body { margin: 0; } }
</style>
</head>
<body>
<button type="button" class="no-print" onclick="window.print()">Imprimir ou salvar como PDF</button>
<header id="cabecalho"><h1>Prova adaptada — Desenho Universal para a Aprendizagem (DUA)</h1>${cabecalho}</header>
<main>${corpo}</main>
${avisoComplexidade}
<section id="professor">
<strong>Uso exclusivo do professor — não entregar ao estudante</strong>
<p><strong>Tags consideradas:</strong> ${escaparHtml(documento.tagsAplicadas.join(', ') || 'Nenhuma')}</p>
<p><strong>Orientações de aplicação:</strong></p>${orientacoes}
<p><strong>Gerado em:</strong> ${escaparHtml(documento.geradoEm)}</p>
</section>
</body>
</html>`;
}

function montarTxt(documento: DocumentoDuaDTO): string {
  const linhas: string[] = [
    'PROVA ADAPTADA - DESENHO UNIVERSAL PARA A APRENDIZAGEM (DUA)',
    `Estudante: ${documento.estudante.nome}`,
    `Matricula: ${documento.estudante.matricula}`,
    `Curso/Turma: ${[documento.estudante.curso, documento.estudante.turma].filter(Boolean).join(' / ') || '-'}`,
    `Gerado em: ${documento.geradoEm}`,
    '',
  ];

  if (documento.questoes.length) {
    documento.questoes.forEach((questao) => {
      linhas.push(`Questao ${questao.numero}`, questao.textoFinal);
      if (questao.status === 'EDITADA') linhas.push('(Revisada manualmente pelo professor.)');
      if (questao.status === 'REJEITADA') {
        linhas.push('(Adaptação rejeitada; enunciado original mantido.)');
        if (questao.justificativaRejeicao) linhas.push(`Motivo: ${questao.justificativaRejeicao}`);
      }
      linhas.push('');
    });
  } else {
    linhas.push(documento.textoFinal, '');
  }

  if (!documento.complexidadePreservada) {
    linhas.push('ATENCAO: a preservacao da complexidade nao foi confirmada. Confira a prova antes de aplica-la.', '');
  }

  linhas.push(
    'USO EXCLUSIVO DO PROFESSOR - NAO ENTREGAR AO ESTUDANTE',
    `Tags consideradas: ${documento.tagsAplicadas.join(', ') || 'Nenhuma'}`,
    'Orientacoes de aplicacao:',
    ...(documento.orientacoes.length ? documento.orientacoes.map((item) => `- ${item}`) : ['- Nao informadas.']),
  );

  return `${linhas.join('\n')}\n`;
}

/** Geração local: o back-end devolve apenas o preview em JSON, sem endpoint de documento. */
export function baixarProvaAdaptada(
  documento: DocumentoDuaDTO,
  formato: 'html' | 'txt',
): void {
  if (formato === 'html') {
    dispararDownload(
      montarHtml(documento),
      'text/html;charset=utf-8',
      nomeArquivo(documento.estudante.matricula, 'html'),
    );
    return;
  }
  dispararDownload(
    montarTxt(documento),
    'text/plain;charset=utf-8',
    nomeArquivo(documento.estudante.matricula, 'txt'),
  );
}
