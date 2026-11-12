package com.br.CLAI.persistence;

import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.service.AlunoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Testcontainers(disabledWithoutDocker = true)
@Transactional
@DisplayName("Integração PostgreSQL 16: busca incremental e sem acentos nos filtros de alunos")
class AlunoFiltragemPostgresIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired
    private AlunoService alunoService;

    @Test
    @DisplayName("PostgreSQL 16 executa busca incremental e sem acento em termo, curso, turma e tag")
    void deveExecutarFiltrosIncrementaisESemAcentosNoPostgresReal() {
        Page<AlunoResponseDTO> porCursoSemAcento = alunoService.listar(
                null, "eletrica", null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of("MAT-TEST-002"),
                porCursoSemAcento.getContent().stream().map(AlunoResponseDTO::matricula).toList());

        Page<AlunoResponseDTO> porCursoParcial = alunoService.listar(
                null, "sist", null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of("MAT-TEST-001"),
                porCursoParcial.getContent().stream().map(AlunoResponseDTO::matricula).toList());

        Page<AlunoResponseDTO> porTurmaParcial = alunoService.listar(
                null, null, "p", null, true, PageRequest.of(0, 10));
        assertEquals(2, porTurmaParcial.getTotalElements());

        Page<AlunoResponseDTO> porTagSemAcento = alunoService.listar(
                null, null, null, "deficiencia", true, PageRequest.of(0, 10));
        assertEquals(List.of("MAT-TEST-001"),
                porTagSemAcento.getContent().stream().map(AlunoResponseDTO::matricula).toList());

        Page<AlunoResponseDTO> porTagSubtexto = alunoService.listar(
                null, null, null, "visual", true, PageRequest.of(0, 10));
        assertEquals(List.of("MAT-TEST-001"),
                porTagSubtexto.getContent().stream().map(AlunoResponseDTO::matricula).toList());

        Page<AlunoResponseDTO> curingaEscapado = alunoService.listar(
                "%", null, null, null, true, PageRequest.of(0, 10));
        assertTrue(curingaEscapado.isEmpty());
    }
}
