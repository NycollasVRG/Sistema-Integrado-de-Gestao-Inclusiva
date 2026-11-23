package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.EscopoDossie;
import com.br.CLAI.domain.enums.StatusAluno;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Estrutura consolidada do Dossiê Jurídico / Institucional do Estudante (US 06).
 * <p>
 * Compila prontuário, documentos pedagógicos, atas de reunião, convocações, notificações/e-mails,
 * anexos e logs imutáveis de auditoria (TA6.2). Quando {@code escopo == EXTERNO}, os campos clínicos
 * sensíveis e registros de nível {@code SUPER_RESTRICAO} (incluindo {@code laudosMedicos}) são
 * automaticamente omitidos em conformidade com a LGPD (TA6.4).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DossieJuridicoResponseDTO(
        String protocolo,
        EscopoDossie escopo,
        LocalDateTime geradoEm,
        UUID geradoPor,
        UUID alunoId,
        String nomeAluno,
        String matricula,
        String curso,
        String turma,
        StatusAluno statusAluno,
        ProntuarioResponseDTO prontuario,
        List<EstudoDeCasoResponseDTO> estudosDeCaso,
        List<PlanoAcaoResponseDTO> planosAcao,
        List<PeiResponseDTO> peis,
        List<PeaResponseDTO> peas,
        List<AtendimentoResponseDTO> atendimentos,
        List<RaiResponseDTO> relatoriosRaiRae,
        List<AtaReuniaoResponseDTO> atasReuniao,
        List<ConvocacaoDossieDTO> convocacoes,
        List<NotificacaoResponseDTO> notificacoes,
        List<AnexoEstudanteResponseDTO> anexos,
        List<AnexoEstudanteResponseDTO> laudosMedicos,
        List<AuditLogResponseDTO> logsAuditoria
) {
}
