import type { Aluno } from '../types/estudoDeCaso';
import type { DadosFormularioPea, PeaResponseDTO } from '../types/pea';
import type { DadosFormularioPei } from '../types/pei';
import type { DadosFormularioPlanoAcao } from '../types/planoAcao';
import {
  OPCOES_HABILIDADES_COGNITIVAS_RAI,
  OPCOES_HABILIDADES_SOCIOEMOCIONAIS_RAI,
  OPCOES_RELACIONAMENTO_RAI,
  type RaiRequestDTO,
  type RaiResponseDTO,
} from '../types/rai';

function esc(valor?: string | null): string {
  if (!valor) return '';
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

function formatarDataBr(iso?: string | null): string {
  if (!iso) return '____/____/_____';
  const partes = iso.slice(0, 10).split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return esc(iso);
}

function marcar(condicao?: boolean | null): string {
  return condicao ? '( X )' : '( &nbsp; )';
}

function abrirJanelaImpressao(titulo: string, corpoHtml: string): void {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${esc(titulo)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; line-height: 1.4; margin: 0; padding: 16px; }
    .toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px; }
    .toolbar button { background: #0F6460; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
    .toolbar button:hover { background: #0b4d4a; }
    .header { text-align: center; margin-bottom: 12px; }
    .header h1 { font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 0.4px; }
    .header h2 { font-size: 12px; margin: 3px 0 0; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    td, th { border: 1px solid #222; padding: 6px 8px; vertical-align: top; }
    .label { font-weight: bold; }
    .sec-title { font-weight: bold; background: #f2f4f3; text-transform: uppercase; }
    .hint { font-size: 10px; color: #444; font-weight: normal; display: block; margin-top: 2px; }
    .content { min-height: 36px; margin-top: 4px; }
    .note { font-size: 10px; font-style: italic; margin: 6px 0 12px; }
    .signatures { margin-top: 18px; page-break-inside: avoid; }
    .sig-line { margin: 14px 0; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 28px; margin-top: 14px; }
    .sig-box { border-top: 1px solid #222; padding-top: 4px; text-align: center; font-size: 10px; margin-top: 24px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Imprimir / Salvar como PDF</button>
  </div>
  ${corpoHtml}
</body>
</html>`;

  const janela = window.open('', '_blank', 'width=900,height=780');
  if (janela) {
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    return;
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function imprimirAnexoIIPlanoAcao(
  aluno: Aluno,
  dados: DadosFormularioPlanoAcao,
  incluirDadosClinicos: boolean
): void {
  const blocoClinico = incluirDadosClinicos
    ? `<tr><td colspan="2">
        <div><span class="label">Há comorbidade relevante:</span> Não ${marcar(dados.possuiComorbidade === false)} &nbsp;&nbsp; Sim ${marcar(dados.possuiComorbidade === true)} &nbsp;&nbsp; <span class="label">Qual(is)?</span> ${esc(dados.comorbidadeDetalhes)}</div>
        <div style="margin-top:4px;"><span class="label">Faz uso de medicação de uso contínuo?</span> Não ${marcar(dados.usaMedicacaoContinua === false)} &nbsp;&nbsp; Sim ${marcar(dados.usaMedicacaoContinua === true)} &nbsp;&nbsp; <span class="label">Qual(is)?</span> ${esc(dados.medicacaoDetalhes)}</div>
        <div style="margin-top:4px;"><span class="label">Frequenta serviços de apoio (FUNAD, APAE, etc.):</span> Não ${marcar(dados.frequentaServicosApoio === false)} &nbsp;&nbsp; Sim ${marcar(dados.frequentaServicosApoio === true)} &nbsp;&nbsp; <span class="label">Qual(is)?</span> ${esc(dados.servicosApoioDetalhes)}</div>
        <div style="margin-top:4px;"><span class="label">Apresentou documentos comprobatórios:</span> Não ${marcar(dados.apresentouDocumentosComprobatorios === false)} &nbsp;&nbsp; Sim ${marcar(dados.apresentouDocumentosComprobatorios === true)} &nbsp;&nbsp; <span class="label">Qual(is)?</span> ${esc(dados.documentosComprobatoriosDetalhes)}</div>
      </td></tr>`
    : '';

  const corpo = `
    <div class="header">
      <h1>ANEXO II</h1>
      <h2>PLANO DE AÇÃO DA CLAI</h2>
    </div>
    <table>
      <tr><td colspan="2"><span class="label">Nome do(a) estudante:</span> ${esc(aluno.nome)}</td></tr>
      <tr>
        <td><span class="label">Matrícula:</span> ${esc(aluno.matricula)}</td>
        <td><span class="label">Curso:</span> ${esc(aluno.curso)}</td>
      </tr>
      <tr>
        <td><span class="label">Período letivo:</span> ${esc(dados.periodoLetivo)}</td>
        <td><span class="label">Período de ingresso:</span> ${esc(dados.periodoIngresso)}</td>
      </tr>
      <tr>
        <td><span class="label">Data de nascimento:</span> ${dados.dataNascimento ? formatarDataBr(dados.dataNascimento) : ''}</td>
        <td><span class="label">Telefone:</span> ${esc(dados.telefoneEstudante)}</td>
      </tr>
      <tr><td colspan="2"><span class="label">E-mail:</span> ${esc(dados.emailEstudante)}</td></tr>
      <tr>
        <td><span class="label">Nome do responsável:</span> ${esc(dados.nomeResponsavel)}</td>
        <td><span class="label">Grau de parentesco:</span> ${esc(dados.grauParentescoResponsavel)}</td>
      </tr>
      <tr>
        <td><span class="label">Telefone:</span> ${esc(dados.telefoneResponsavel)}</td>
        <td><span class="label">E-mail:</span> ${esc(dados.emailResponsavel)}</td>
      </tr>
      ${blocoClinico}
      <tr><td colspan="2">
        <div class="sec-title">IDENTIFICAÇÃO DA(S) NECESSIDADE(S) ESPECÍFICA(S)</div>
        <span class="hint">Considerar: idiossincrasias, diagnósticos e encaminhamentos anteriores; comorbidades relevantes; medicação de uso contínuo; dependência/autonomia no contexto familiar/escolar; frequência em serviços de apoio; conflitos no campo psicossocial relacionados à escolha profissional.</span>
        <div class="content"><span class="label">Considerações:</span> ${esc(dados.identificacaoNecessidadesEspecificas)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">RELATO SISTEMATIZADO DOS AVANÇOS, DIFICULDADES, POTENCIALIDADES DO(A) ESTUDANTE EM SEU PERCURSO EDUCACIONAL</div>
        <div class="content">${esc(dados.relatoPercursoEducacional)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">PRINCIPAIS DEMANDAS IDENTIFICADAS NO CASO</div>
        <div class="content">${esc(dados.demandasIdentificadas)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">DESCRIÇÃO DAS PROPOSTAS INICIAIS DE INTERVENÇÃO</div>
        <div class="content">${esc(dados.propostasIntervencao)}</div>
      </td></tr>
    </table>
    <div class="signatures">
      <div class="sig-line"><span class="label">Assinatura do(a) coordenador(a) da CLAI:</span> ${esc(dados.assinaturaCoordenadorClai) || '_____________________________________________'}</div>
      <div class="sig-line"><span class="label">Data:</span> ${formatarDataBr(dados.dataAssinatura)}</div>
    </div>
  `;

  abrirJanelaImpressao(`Anexo II - Plano de Acao CLAI - ${aluno.nome}`, corpo);
}

export function imprimirAnexoIIIPei(
  aluno: Aluno,
  dados: DadosFormularioPei,
  peasVinculados: PeaResponseDTO[] = []
): void {
  const docentes = (dados.assinaturasDocentes ?? []).filter((d) => d.trim().length > 0);
  const linhasDocentes = Math.max(4, docentes.length);
  const blocosDocentes = Array.from({ length: linhasDocentes })
    .map((_, i) => `<div class="sig-box">${esc(docentes[i] || 'Assinatura do(a) Docente')}</div>`)
    .join('');

  const listaPeas =
    peasVinculados.length > 0
      ? `<p class="note"><strong>PEAs anexados (${peasVinculados.length}):</strong> ${peasVinculados
          .map((p) => esc(`${p.componenteCurricular || 'Componente'} (${p.semestreAno || ''}) — ${p.docente || ''}`))
          .join('; ')}</p>`
      : '';

  const corpo = `
    <div class="header">
      <h1>ANEXO III</h1>
      <h2>PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)</h2>
    </div>
    <table>
      <tr><td colspan="2"><span class="label">Nome do estudante:</span> ${esc(aluno.nome)}</td></tr>
      <tr>
        <td><span class="label">Matrícula:</span> ${esc(aluno.matricula)}</td>
        <td><span class="label">Curso:</span> ${esc(aluno.curso)}</td>
      </tr>
      <tr><td colspan="2"><span class="label">Semestre/Ano:</span> ${esc(dados.semestreAno)}</td></tr>
      <tr><td colspan="2">
        <div class="sec-title">Histórico (antes e na instituição) <span class="hint">*preenchido pela Equipe Pedagógica, Assistência Estudantil e CLAI</span></div>
        <div class="content">${esc(dados.historicoEstudante)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">Necessidades Específicas <span class="hint">*preenchido pela Equipe Pedagógica, Assistência Estudantil e CLAI</span></div>
        <div class="content">${esc(dados.necessidadesEspecificas)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">Conhecimentos, Habilidades, Capacidades, Interesses, Necessidades <span class="hint">*preenchido pela Equipe Pedagógica e CLAI</span></div>
        <div class="content">${esc(dados.habilidadesInteresses)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">Dificuldades apresentadas <span class="hint">*preenchido pela Equipe Pedagógica e CLAI</span></div>
        <div class="content">${esc(dados.dificuldadesApresentadas)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">Propostas de Adaptações Curriculares <span class="hint">*preenchido pela equipe pedagógica, CLAI e docentes</span></div>
        <div class="content">${esc(dados.propostasAdaptacoes)}</div>
      </td></tr>
    </table>
    <p class="note">*anexar Planos de Ensino Adaptados (PEA) dos componentes curriculares que necessitaram de alguma adaptação curricular</p>
    ${listaPeas}
    <div class="signatures">
      <div class="sig-line"><span class="label">Assinatura da CLAI:</span> ${esc(dados.assinaturaClai) || '_____________________________________________'}</div>
      <div class="sig-line"><span class="label">Assinatura do Setor Pedagógico (responsável):</span> ${esc(dados.assinaturaSetorPedagogico) || '_____________________________________________'}</div>
      <div class="sig-line"><span class="label">Assinatura do(a) Coordenador(a) de Curso:</span> ${esc(dados.assinaturaCoordenadorCurso) || '_____________________________________________'}</div>
      <div class="sig-line"><span class="label">Assinatura do Estudante ou Responsável:</span> ${esc(dados.assinaturaEstudanteResponsavel) || '_____________________________________________'}</div>
      <div class="sig-line"><span class="label">Assinatura dos Docentes:</span></div>
      <div class="sig-grid">${blocosDocentes}</div>
    </div>
  `;

  abrirJanelaImpressao(`Anexo III - PEI - ${aluno.nome}`, corpo);
}

export function imprimirAnexoIIIPea(aluno: Aluno, dados: DadosFormularioPea): void {
  const corpo = `
    <div class="header">
      <h1>ANEXO III</h1>
      <h2>PLANO DE ENSINO ADAPTADO (PEA)</h2>
    </div>
    <table>
      <tr><td colspan="2"><span class="label">Nome do estudante:</span> ${esc(aluno.nome)}</td></tr>
      <tr>
        <td><span class="label">Matrícula:</span> ${esc(aluno.matricula)}</td>
        <td><span class="label">Curso:</span> ${esc(aluno.curso)}</td>
      </tr>
      <tr>
        <td><span class="label">Componente Curricular:</span> ${esc(dados.componenteCurricular)}</td>
        <td><span class="label">Semestre/Ano:</span> ${esc(dados.semestreAno)}</td>
      </tr>
      <tr><td colspan="2"><span class="label">Docente:</span> ${esc(dados.docente)}</td></tr>
      <tr><td colspan="2">
        <div class="sec-title">OBJETIVO GERAL DO COMPONENTE CURRICULAR</div>
        <div class="content">${esc(dados.objetivoGeral)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">OBJETIVOS ESPECÍFICOS</div>
        <div class="content">${esc(dados.objetivosEspecificos)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">CONTEÚDOS PROGRAMÁTICOS</div>
        <div class="content">${esc(dados.conteudosProgramaticos)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">METODOLOGIA</div>
        <div class="content">${esc(dados.metodologia)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">AVALIAÇÃO</div>
        <div class="content">${esc(dados.avaliacao)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">BIBLIOGRAFIA BÁSICA <span class="hint">(Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT)</span></div>
        <div class="content">${esc(dados.bibliografiaBasica)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="sec-title">BIBLIOGRAFIA COMPLEMENTAR <span class="hint">(Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT)</span></div>
        <div class="content">${esc(dados.bibliografiaComplementar)}</div>
      </td></tr>
    </table>
    <p class="note">*esse documento integra o PEI e deve ser preenchido por cada docente que precisar realizar adaptações em seu componente curricular</p>
    <div class="signatures">
      <div class="sig-line"><span class="label">Assinatura do(a) Docente:</span> ${esc(dados.assinaturaDocente || dados.docente) || '_____________________________________________'}</div>
      ${dados.dataAssinatura ? `<div class="sig-line"><span class="label">Data:</span> ${formatarDataBr(dados.dataAssinatura)}</div>` : ''}
    </div>
  `;

  abrirJanelaImpressao(`Anexo III - PEA - ${aluno.nome}`, corpo);
}

function renderCheckboxes(
  todas: readonly string[],
  marcadas: string[] | undefined,
  outrosTexto?: string | null
): string {
  const set = new Set((marcadas ?? []).map((s) => s.toLowerCase()));
  return todas
    .map((item) => {
      const checked = set.has(item.toLowerCase());
      if (item === 'outros') {
        return `${marcar(checked)} outros: ${esc(outrosTexto) || '____________________________'}`;
      }
      return `${marcar(checked)} ${esc(item)}`;
    })
    .join(' &nbsp;&nbsp;&nbsp; ');
}

export function imprimirAnexoVRai(
  aluno: { nome: string; matricula: string; curso?: string | null },
  dados: RaiRequestDTO | RaiResponseDTO
): void {
  const habilidades = dados.habilidadesDesenvolvidas ?? [];
  const linhasHabilidades =
    habilidades.length > 0
      ? habilidades
          .map(
            (h) => `<tr><td colspan="2">
              <div><span class="label">Habilidade desenvolvida:</span> ${esc(h.habilidadeDesenvolvida)}</div>
              <div style="margin-top:4px;"><span class="label">Nível de aprendizado:</span>
                ${marcar(h.nivelAprendizado === 'SATISFATORIO')} Satisfatório &nbsp;&nbsp;
                ${marcar(h.nivelAprendizado === 'BOM')} Bom &nbsp;&nbsp;
                ${marcar(h.nivelAprendizado === 'OTIMO')} Ótimo
              </div>
              <div style="margin-top:4px;"><span class="label">Observações:</span> ${esc(h.observacoes)}</div>
            </td></tr>`
          )
          .join('')
      : `<tr><td colspan="2">
          <div><span class="label">Habilidade desenvolvida:</span></div>
          <div style="margin-top:4px;"><span class="label">Nível de aprendizado:</span> ( &nbsp; ) Satisfatório &nbsp;&nbsp; ( &nbsp; ) Bom &nbsp;&nbsp; ( &nbsp; ) Ótimo</div>
          <div style="margin-top:4px;"><span class="label">Observações:</span></div>
        </td></tr>`;

  const corpo = `
    <div class="header">
      <h1>ANEXO V</h1>
      <h2>RELATÓRIO DE ACOMPANHAMENTO INDIVIDUALIZADO (${esc(dados.tipoRelatorio || 'RAI')})</h2>
    </div>
    <table>
      <tr><td colspan="2"><span class="label">Nome do estudante:</span> ${esc(aluno.nome)}</td></tr>
      <tr>
        <td><span class="label">Matrícula:</span> ${esc(aluno.matricula)}</td>
        <td><span class="label">Curso:</span> ${esc(aluno.curso)}</td>
      </tr>
      <tr>
        <td><span class="label">Período letivo:</span> ${esc(dados.periodoLetivo)} (${dados.bimestre}º bimestre)</td>
        <td><span class="label">Componente Curricular:</span> ${esc(dados.componenteCurricular)}</td>
      </tr>
      <tr><td colspan="2"><span class="label">Docente:</span> ${esc(dados.docente)}</td></tr>
      <tr><td colspan="2" class="sec-title">ASPECTOS OBSERVADOS</td></tr>
      <tr><td colspan="2">
        <div><span class="label">Relacionamento:</span><br/>${renderCheckboxes(OPCOES_RELACIONAMENTO_RAI, dados.relacionamentoOpcoes, dados.relacionamentoOutros)}</div>
        <div style="margin-top:4px;"><span class="label">Comentário (se necessário):</span> ${esc(dados.relacionamentoComentario)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div><span class="label">Principais habilidades cognitivas:</span><br/>${renderCheckboxes(OPCOES_HABILIDADES_COGNITIVAS_RAI, dados.habilidadesCognitivasOpcoes, dados.habilidadesCognitivasOutros)}</div>
        <div style="margin-top:4px;"><span class="label">Comentário (se necessário):</span> ${esc(dados.habilidadesCognitivasComentario)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div><span class="label">Principais habilidades socioemocionais:</span><br/>${renderCheckboxes(OPCOES_HABILIDADES_SOCIOEMOCIONAIS_RAI, dados.habilidadesSocioemocionaisOpcoes, dados.habilidadesSocioemocionaisOutros)}</div>
        <div style="margin-top:4px;"><span class="label">Comentário (se necessário):</span> ${esc(dados.habilidadesSocioemocionaisComentario)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="label">Avanços gerais do(a) estudante no período</div>
        <div class="content">${esc(dados.avancosGerais)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="label">Relato das dificuldades de aprendizagem observadas</div>
        <div class="content">${esc(dados.dificuldadesAprendizagem)}</div>
      </td></tr>
      <tr><td colspan="2">
        <div class="label">Fatores externos que estejam influenciando no processo escolar</div>
        <div class="content">${esc(dados.fatoresExternos)}</div>
      </td></tr>
      <tr><td colspan="2" class="sec-title">HABILIDADES E COMPETÊNCIAS DESENVOLVIDAS PELO ESTUDANTE NO COMPONENTE CURRICULAR</td></tr>
      ${linhasHabilidades}
      <tr><td colspan="2">
        <div class="sec-title">PARECER</div>
        <div class="content">${esc(dados.parecer || dados.descricao)}</div>
      </td></tr>
    </table>
    <div class="signatures">
      <div class="sig-line"><span class="label">Data:</span> ${formatarDataBr(dados.dataRelatorio)}</div>
      <div class="sig-box" style="max-width: 340px;">${esc(dados.assinaturaDocente || dados.docente) || 'Assinatura do(a) docente'}</div>
    </div>
  `;

  abrirJanelaImpressao(`Anexo V - RAI - ${aluno.nome}`, corpo);
}
