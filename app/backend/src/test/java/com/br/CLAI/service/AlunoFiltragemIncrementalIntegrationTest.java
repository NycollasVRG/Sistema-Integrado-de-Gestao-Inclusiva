package com.br.CLAI.service;

import com.br.CLAI.controller.AlunoController;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Busca incremental e normalização em todos os filtros de alunos")
class AlunoFiltragemIncrementalIntegrationTest {

    @Autowired
    private AlunoService alunoService;

    @Autowired
    private AlunoController alunoController;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private IndicadorReutilizavelRepository indicadorRepository;

    private Aluno alunoJoao;
    private Aluno alunoMaria;
    private Aluno alunoSemCursoTurma;
    private Aluno alunoInativo;

    @BeforeEach
    void setUp() {
        IndicadorReutilizavel tagVisual = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Deficiência Visual", "Baixa visão ou cegueira"));
        IndicadorReutilizavel tagTea = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Transtorno do Espectro Autista (TEA)", "TEA"));
        IndicadorReutilizavel tagAuditiva = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Deficiência Auditiva", "Perda auditiva"));

        alunoJoao = criarAluno("João Conceição", "2026-INF-001", "Tecnologia em Sistemas para Internet",
                "2026.1", StatusAluno.ATIVO, true, Set.of(tagVisual));
        alunoMaria = criarAluno("Maria José da Silva", "2026-ELE-002", "Engenharia Elétrica",
                "P4-Noite", StatusAluno.ATIVO, true, Set.of(tagTea, tagAuditiva));
        alunoSemCursoTurma = criarAluno("Carlos 100% Focado_Teste", "2026-ESP-003", null,
                null, StatusAluno.ATIVO, true, Set.of(tagVisual));
        alunoInativo = criarAluno("Ana Paula Evadida", "2025-INF-099", "Informática Integrado",
                "3º Ano A", StatusAluno.EVADIDO, false, Set.of(tagAuditiva));
    }

    private Aluno criarAluno(String nome, String matricula, String curso, String turma,
                             StatusAluno status, boolean ativo, Set<IndicadorReutilizavel> tags) {
        Aluno aluno = new Aluno(nome, matricula);
        aluno.setCurso(curso);
        aluno.setTurma(turma);
        aluno.setStatus(status);
        aluno.setAtivo(ativo);
        aluno.setTagsDificuldade(new LinkedHashSet<>(tags));
        return alunoRepository.saveAndFlush(aluno);
    }

    @Test
    @DisplayName("termo deve buscar parcialmente por nome ou matrícula ignorando caixa e acentos")
    void deveFiltrarPorTermoIncrementalESemAcento() {
        Page<AlunoResponseDTO> porNomeSemAcento = alunoService.listar(
                "joao conceicao", null, null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoJoao.getId()),
                porNomeSemAcento.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> porTrechoMatricula = alunoService.listar(
                "ELE-00", null, null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoMaria.getId()),
                porTrechoMatricula.getContent().stream().map(AlunoResponseDTO::id).toList());
    }

    @Test
    @DisplayName("curso deve buscar incrementalmente por substring ignorando caixa e acentos")
    void deveFiltrarPorCursoIncrementalmente() {
        Page<AlunoResponseDTO> porTrechoSistemas = alunoService.listar(
                null, "sist", null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoJoao.getId()),
                porTrechoSistemas.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> porTrechoSemAcento = alunoService.listar(
                null, "eletrica", null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoMaria.getId()),
                porTrechoSemAcento.getContent().stream().map(AlunoResponseDTO::id).toList());
    }

    @Test
    @DisplayName("turma deve buscar incrementalmente por substring ignorando caixa e acentos")
    void deveFiltrarPorTurmaIncrementalmente() {
        Page<AlunoResponseDTO> porAno = alunoService.listar(
                null, null, "2026", null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoJoao.getId()),
                porAno.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> porPeriodo = alunoService.listar(
                null, null, "p4", null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoMaria.getId()),
                porPeriodo.getContent().stream().map(AlunoResponseDTO::id).toList());
    }

    @Test
    @DisplayName("tag e tagAcessibilidade devem buscar incrementalmente por substring ignorando acentos")
    void deveFiltrarPorTagIncrementalmente() {
        Page<AlunoResponseDTO> porDeficSemAcento = alunoService.listar(
                null, null, null, "deficiencia", true, PageRequest.of(0, 10));
        assertEquals(3, porDeficSemAcento.getTotalElements());

        Page<AlunoResponseDTO> porVisual = alunoService.listar(
                null, null, null, "visual", true, PageRequest.of(0, 10));
        assertEquals(Set.of(alunoJoao.getId(), alunoSemCursoTurma.getId()),
                Set.copyOf(porVisual.getContent().stream().map(AlunoResponseDTO::id).toList()));

        Page<AlunoResponseDTO> viaTagAcessibilidade = alunoController.listar(
                null, null, null, null, "tea", true, PageRequest.of(0, 10)).getBody();
        assertEquals(List.of(alunoMaria.getId()),
                viaTagAcessibilidade.getContent().stream().map(AlunoResponseDTO::id).toList());
    }

    @Test
    @DisplayName("deve combinar múltiplos filtros parciais e respeitar status ativo/inativo")
    void deveCombinarMultiplosFiltrosIncrementalmente() {
        Page<AlunoResponseDTO> combinadoAtivo = alunoService.listar(
                "maria", "eng", "noite", "audit", true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoMaria.getId()),
                combinadoAtivo.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> inativoPorFiltrosParciais = alunoService.listar(
                "paula", "informatica", "ano", "auditiva", false, PageRequest.of(0, 10));
        assertEquals(List.of(alunoInativo.getId()),
                inativoPorFiltrosParciais.getContent().stream().map(AlunoResponseDTO::id).toList());
    }

    @Test
    @DisplayName("deve escapar curingas LIKE (% e _) e lidar com curso/turma nulos")
    void deveEscaparCuringasLikeELidarComCamposNulos() {
        Page<AlunoResponseDTO> apenasComPorcentagem = alunoService.listar(
                "100%", null, null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoSemCursoTurma.getId()),
                apenasComPorcentagem.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> apenasComUnderline = alunoService.listar(
                "focado_t", null, null, null, true, PageRequest.of(0, 10));
        assertEquals(List.of(alunoSemCursoTurma.getId()),
                apenasComUnderline.getContent().stream().map(AlunoResponseDTO::id).toList());

        Page<AlunoResponseDTO> semFiltrosIncluiNulos = alunoService.listar(
                null, null, null, null, true, PageRequest.of(0, 10));
        assertTrue(semFiltrosIncluiNulos.getContent().stream()
                .anyMatch(a -> a.id().equals(alunoSemCursoTurma.getId())));
    }
}
