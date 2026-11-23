package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.domain.enums.TipoAlertaPedagogico;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representação de resposta de um alerta pedagógico no Dashboard da CLAI (US 05).
 */
public record AlertaPedagogicoResponseDTO(
        UUID id,
        UUID alunoId,
        String alunoNome,
        String alunoMatricula,
        TipoAlertaPedagogico tipoAlerta,
        SeveridadeAlerta severidade,
        String unidade,
        String curso,
        String turma,
        String descricao,
        Boolean tratado,
        UUID tratadoPor,
        LocalDateTime tratadoEm,
        LocalDateTime criadoEm
) {
}
