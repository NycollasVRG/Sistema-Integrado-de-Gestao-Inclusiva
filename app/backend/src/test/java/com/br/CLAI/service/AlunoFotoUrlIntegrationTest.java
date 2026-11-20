package com.br.CLAI.service;

import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.dto.request.AlunoRequestDTO;
import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("TA9.1 - Persistência e validação de fotoUrl no cadastro e edição de aluno")
class AlunoFotoUrlIntegrationTest {

    @Autowired
    private AlunoService alunoService;

    @Autowired
    private IndicadorReutilizavelRepository indicadorRepository;

    @Autowired
    private Validator validator;

    private UUID tagId;
    private UUID usuarioId;

    @BeforeEach
    void setUp() {
        IndicadorReutilizavel tag = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Deficiência Visual - Foto Teste", "Descrição teste"));
        tagId = tag.getId();
        usuarioId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Deve persistir, retornar, atualizar e limpar fotoUrl no ciclo completo de Aluno")
    void devePersistirAtualizarELimparFotoUrl() {
        String urlInicial = "https://cdn.ifpb.edu.br/fotos/aluno-2026001.jpg";
        AlunoRequestDTO criacao = new AlunoRequestDTO(
                "Lucas Almeida",
                "2026-FOTO-001",
                "Análise e Desenvolvimento de Sistemas",
                "P3",
                StatusAluno.ATIVO,
                List.of(tagId),
                "  " + urlInicial + "  "
        );

        AlunoResponseDTO criado = alunoService.criar(criacao, usuarioId);
        assertEquals(urlInicial, criado.fotoUrl());

        AlunoResponseDTO buscado = alunoService.buscarPorId(criado.id());
        assertEquals(urlInicial, buscado.fotoUrl());

        String urlAtualizada = "https://cdn.ifpb.edu.br/fotos/aluno-2026001-v2.png";
        AlunoRequestDTO atualizacao = new AlunoRequestDTO(
                "Lucas Almeida",
                "2026-FOTO-001",
                "Análise e Desenvolvimento de Sistemas",
                "P4",
                StatusAluno.ATIVO,
                List.of(tagId),
                urlAtualizada
        );

        AlunoResponseDTO atualizado = alunoService.atualizar(criado.id(), atualizacao, usuarioId);
        assertEquals(urlAtualizada, atualizado.fotoUrl());

        AlunoRequestDTO limpeza = new AlunoRequestDTO(
                "Lucas Almeida",
                "2026-FOTO-001",
                "Análise e Desenvolvimento de Sistemas",
                "P4",
                StatusAluno.ATIVO,
                List.of(tagId),
                "   "
        );

        AlunoResponseDTO semFoto = alunoService.atualizar(criado.id(), limpeza, usuarioId);
        assertNull(semFoto.fotoUrl());
    }

    @Test
    @DisplayName("Deve rejeitar esquemas inseguros como javascript: em fotoUrl e aceitar nulo/vazio/http/https/relativo")
    void deveValidarEsquemaSeguroEmFotoUrl() {
        AlunoRequestDTO invalido = new AlunoRequestDTO(
                "Estudante XSS",
                "2026-XSS-001",
                "Informática",
                "2026.1",
                StatusAluno.ATIVO,
                List.of(tagId),
                "javascript:alert(1)"
        );

        Set<ConstraintViolation<AlunoRequestDTO>> violacoes = validator.validate(invalido);
        assertFalse(violacoes.isEmpty());
        assertTrue(violacoes.stream().anyMatch(v -> "fotoUrl".equals(v.getPropertyPath().toString())));

        for (String urlValida : new String[]{null, "", "https://example.com/foto.png", "http://localhost/foto.jpg", "/fotos/aluno.png"}) {
            AlunoRequestDTO dto = new AlunoRequestDTO(
                    "Estudante Válido",
                    "2026-OK-001",
                    "Informática",
                    "2026.1",
                    StatusAluno.ATIVO,
                    List.of(tagId),
                    urlValida
            );
            assertTrue(validator.validate(dto).isEmpty(), "Esperava URL válida: " + urlValida);
        }
    }
}
