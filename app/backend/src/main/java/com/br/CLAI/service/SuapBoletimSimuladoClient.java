package com.br.CLAI.service;

import com.br.CLAI.dto.request.SuapBoletimDTO;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementação padrão simulada do cliente SUAP para ambientes sem integração externa ativa,
 * permitindo registrar e consultar boletins simulados em desenvolvimento e testes automatizados.
 */
@Component
public class SuapBoletimSimuladoClient implements SuapBoletimClient {

    private final Map<String, SuapBoletimDTO> boletinsPorMatricula = new ConcurrentHashMap<>();

    @Override
    public Optional<SuapBoletimDTO> consultarBoletimPorMatricula(String matricula) {
        if (matricula == null || matricula.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(boletinsPorMatricula.get(matricula.trim()));
    }

    public void registrarBoletimSimulado(String matricula, SuapBoletimDTO boletim) {
        if (matricula != null && !matricula.isBlank() && boletim != null) {
            boletinsPorMatricula.put(matricula.trim(), boletim);
        }
    }

    public void limparBoletinsSimulados() {
        boletinsPorMatricula.clear();
    }
}
