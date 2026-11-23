package com.br.CLAI.service;

import com.br.CLAI.dto.request.SuapBoletimDTO;

import java.util.Optional;

/**
 * Porta de integração para consulta do boletim e situação acadêmica do estudante no SUAP (US 05).
 */
public interface SuapBoletimClient {

    /**
     * Consulta os dados acadêmicos e notas do boletim do estudante no SUAP pela matrícula institucional.
     */
    Optional<SuapBoletimDTO> consultarBoletimPorMatricula(String matricula);
}
