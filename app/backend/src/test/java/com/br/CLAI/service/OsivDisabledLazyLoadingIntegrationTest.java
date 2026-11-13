package com.br.CLAI.service;

import com.br.CLAI.controller.AlunoController;
import com.br.CLAI.controller.EstudoDeCasoController;
import com.br.CLAI.controller.IndicadorReutilizavelController;
import com.br.CLAI.controller.PeaController;
import com.br.CLAI.controller.PeiController;
import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.mapper.AlunoMapper;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.mapper.PeiMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.hibernate.annotations.BatchSize;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Desativação do OSIV, Prevenção de LazyInitializationException e Queries N+1")
class OsivDisabledLazyLoadingIntegrationTest {

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private IndicadorReutilizavelRepository indicadorRepository;

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Mock
    private AcompanhamentoRepository acompanhamentoRepository;

    @Mock
    private PeaRepository peaRepository;

    @Mock
    private PeiRepository peiRepository;

    @Test
    @DisplayName("Passo 1: application.yaml deve definir explicitamente spring.jpa.open-in-view: false")
    void deveTerOpenInViewDesativadoNoApplicationYaml() {
        YamlPropertiesFactoryBean yamlFactory = new YamlPropertiesFactoryBean();
        yamlFactory.setResources(new ClassPathResource("application.yaml"));
        Properties props = yamlFactory.getObject();

        assertNotNull(props, "As propriedades do application.yaml devem ser carregadas.");
        assertEquals("false", props.getProperty("spring.jpa.open-in-view"),
                "spring.jpa.open-in-view deve estar definido como false no application.yaml");
    }

    @Test
    @DisplayName("Passo 2 e 3: Todos os métodos de leitura dos Services devem possuir @Transactional(readOnly = true)")
    void todosMetodosDeLeituraDosServicesDevemSerTransacionaisReadOnly() throws NoSuchMethodException {
        assertMethodReadOnlyTransactional(AlunoService.class.getMethod("buscarPorId", UUID.class));
        assertMethodReadOnlyTransactional(AlunoService.class.getMethod(
                "listar", String.class, String.class, String.class, String.class, Boolean.class, Pageable.class));

        assertMethodReadOnlyTransactional(EstudoDeCasoService.class.getMethod("buscarPorId", UUID.class));
        assertMethodReadOnlyTransactional(EstudoDeCasoService.class.getMethod("listarPorAluno", UUID.class));

        assertMethodReadOnlyTransactional(PeaService.class.getMethod("listarTodos"));
        assertMethodReadOnlyTransactional(PeaService.class.getMethod("buscarPorId", UUID.class));
        assertMethodReadOnlyTransactional(PeaService.class.getMethod("listarPorAcompanhamento", UUID.class));
        assertMethodReadOnlyTransactional(PeaService.class.getMethod("listarPorAluno", UUID.class));
        assertMethodReadOnlyTransactional(PeaService.class.getMethod("listarPorPei", UUID.class));

        assertMethodReadOnlyTransactional(PeiService.class.getMethod("listarTodos"));
        assertMethodReadOnlyTransactional(PeiService.class.getMethod("buscarPorId", UUID.class));
        assertMethodReadOnlyTransactional(PeiService.class.getMethod("listarPorAcompanhamento", UUID.class));
        assertMethodReadOnlyTransactional(PeiService.class.getMethod("listarPorAluno", UUID.class));
        assertMethodReadOnlyTransactional(PeiService.class.getMethod("listarAnexosSensiveis", UUID.class));

        assertMethodReadOnlyTransactional(ProntuarioService.class.getMethod("buscarProntuarioPorEstudante", UUID.class));
        assertMethodReadOnlyTransactional(ProntuarioService.class.getMethod("buscarHistoricoSocioemocional", UUID.class));

        assertMethodReadOnlyTransactional(TimelineService.class.getMethod("buscarPorAluno", UUID.class));

        assertMethodReadOnlyTransactional(AnexoEstudanteService.class.getMethod("listarAnexosPorEstudante", UUID.class));

        assertMethodReadOnlyTransactional(IndicadorReutilizavelService.class.getMethod("listar"));
    }

    @Test
    @DisplayName("Passo 4: Repositories devem possuir @EntityGraph configurado para evitar N+1 e LazyInitializationException")
    void repositoriesDevemPossuirEntityGraphConfigurado() throws NoSuchMethodException, NoSuchFieldException {
        // AlunoRepository
        assertEntityGraph(AlunoRepository.class.getMethod("findById", UUID.class), "tagsDificuldade");
        assertEntityGraph(AlunoRepository.class.getMethod("findByMatricula", String.class), "tagsDificuldade");

        // EstudoDeCasoRepository
        assertEntityGraph(EstudoDeCasoRepository.class.getMethod("findById", UUID.class), "indicadores", "aluno");
        assertEntityGraph(EstudoDeCasoRepository.class.getMethod("findByAlunoId", UUID.class), "indicadores", "aluno");

        // EstudoDeCaso @BatchSize em indicadores
        Field indicadoresField = EstudoDeCaso.class.getDeclaredField("indicadores");
        assertTrue(indicadoresField.isAnnotationPresent(BatchSize.class),
                "A coleção indicadores em EstudoDeCaso deve possuir @BatchSize para proteção contra N+1");

        // PeaRepository
        assertEntityGraph(PeaRepository.class.getMethod("findAll"), "acompanhamento", "acompanhamento.aluno", "pei");
        assertEntityGraph(PeaRepository.class.getMethod("findById", UUID.class), "acompanhamento", "acompanhamento.aluno", "pei");
        assertEntityGraph(PeaRepository.class.getMethod("findByAcompanhamentoId", UUID.class), "acompanhamento", "acompanhamento.aluno", "pei");
        assertEntityGraph(PeaRepository.class.getMethod("findByAcompanhamento_Aluno_Id", UUID.class), "acompanhamento", "acompanhamento.aluno", "pei");
        assertEntityGraph(PeaRepository.class.getMethod("findByPeiId", UUID.class), "acompanhamento", "acompanhamento.aluno", "pei");

        // PeiRepository
        assertEntityGraph(PeiRepository.class.getMethod("findAll"), "acompanhamento", "acompanhamento.aluno");
        assertEntityGraph(PeiRepository.class.getMethod("findById", UUID.class), "acompanhamento", "acompanhamento.aluno");
        assertEntityGraph(PeiRepository.class.getMethod("findByAcompanhamentoId", UUID.class), "acompanhamento", "acompanhamento.aluno");
        assertEntityGraph(PeiRepository.class.getMethod("findByAcompanhamento_Aluno_Id", UUID.class), "acompanhamento", "acompanhamento.aluno");

        // AnexoEstudanteRepository
        assertEntityGraph(AnexoEstudanteRepository.class.getMethod("findById", UUID.class), "aluno");
        assertEntityGraph(AnexoEstudanteRepository.class.getMethod("findByAlunoIdOrderByCriadoEmDesc", UUID.class), "aluno");
    }

    @Test
    @DisplayName("Passo 4: Conversão para DTO de Aluno, EstudoDeCaso, PEA, PEI e Indicadores deve ocorrer integralmente no Service")
    void deveConverterEntidadesComRelacionamentosLazyDentroDosServices() {
        UUID alunoId = UUID.randomUUID();
        UUID tagId = UUID.randomUUID();
        IndicadorReutilizavel tag = new IndicadorReutilizavel("TDAH", "Transtorno de Déficit de Atenção");
        tag.setId(tagId);

        Aluno aluno = new Aluno("Maria Inclusão", "20261001");
        aluno.setId(alunoId);
        aluno.setCurso("Informática");
        aluno.setTurma("1A");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(tag)));

        // 1. AlunoService + AlunoController
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(alunoRepository.buscarComFiltros(anyString(), anyString(), anyString(), anyString(), anyBoolean(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(aluno)));

        AlunoService alunoService = new AlunoService(alunoRepository, indicadorRepository, new AlunoMapper());
        AlunoController alunoController = new AlunoController(alunoService, new RbacGuard());

        ResponseEntity<AlunoResponseDTO> alunoResp = alunoController.buscarPorId(alunoId);
        assertEquals(200, alunoResp.getStatusCode().value());
        assertNotNull(alunoResp.getBody());
        assertEquals(List.of("TDAH"), alunoResp.getBody().tagsDificuldade());
        assertEquals(List.of(tagId), alunoResp.getBody().tagsDificuldadeIds());

        ResponseEntity<Page<AlunoResponseDTO>> pageResp = alunoController.listar(
                null, null, null, null, null, true, PageRequest.of(0, 10));
        assertEquals(1, pageResp.getBody().getTotalElements());
        assertEquals(List.of("TDAH"), pageResp.getBody().getContent().getFirst().tagsDificuldade());

        // 2. EstudoDeCasoService + EstudoDeCasoController
        UUID estudoId = UUID.randomUUID();
        EstudoDeCaso estudo = new EstudoDeCaso(aluno, StatusEstudoCaso.ATIVO, "Diagnóstico Inicial");
        estudo.setId(estudoId);
        estudo.setIndicadores(List.of(tag));

        when(alunoRepository.existsById(alunoId)).thenReturn(true);
        when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudo));

        EstudoDeCasoService estudoService = new EstudoDeCasoService(
                estudoDeCasoRepository, alunoRepository, indicadorRepository, new EstudoDeCasoValidator(), new EstudoDeCasoMapper());
        EstudoDeCasoController estudoController = new EstudoDeCasoController(estudoService);

        ResponseEntity<List<EstudoDeCasoResponseDTO>> estudosResp = estudoController.listarPorAluno(alunoId);
        assertEquals(1, estudosResp.getBody().size());
        assertEquals(List.of(tagId), estudosResp.getBody().getFirst().indicadoresIds());
        assertEquals(alunoId, estudosResp.getBody().getFirst().alunoId());

        // 3. PeaService + PeaController & PeiService + PeiController
        UUID acompId = UUID.randomUUID();
        Acompanhamento acompanhamento = new Acompanhamento(aluno, LocalDate.now());
        acompanhamento.setId(acompId);

        Pea pea = new Pea(acompanhamento, UUID.randomUUID(), "Objetivo", "Metodologia", "Avaliação");
        pea.setId(UUID.randomUUID());
        when(peaRepository.findAll()).thenReturn(List.of(pea));

        PeaService peaService = new PeaService(peaRepository, acompanhamentoRepository, new PeaMapper());
        PeaController peaController = new PeaController(peaService);
        ResponseEntity<List<PeaResponseDTO>> peasResp = peaController.listarTodos();
        assertEquals(1, peasResp.getBody().size());
        assertEquals(alunoId, peasResp.getBody().getFirst().alunoId());
        assertEquals(acompId, peasResp.getBody().getFirst().acompanhamentoId());

        Pei pei = new Pei(acompanhamento, "Habilidades", "Adaptações");
        pei.setId(UUID.randomUUID());
        when(peiRepository.findAll()).thenReturn(List.of(pei));

        PeiService peiService = new PeiService(peiRepository, acompanhamentoRepository, peaRepository, new PeiMapper(), new PeaMapper());
        PeiController peiController = new PeiController(peiService);
        ResponseEntity<List<PeiResponseDTO>> peisResp = peiController.listarTodos();
        assertEquals(1, peisResp.getBody().size());
        assertEquals(alunoId, peisResp.getBody().getFirst().alunoId());
        assertEquals(acompId, peisResp.getBody().getFirst().acompanhamentoId());

        // 4. IndicadorReutilizavelService + IndicadorReutilizavelController
        when(indicadorRepository.findAll(any(Sort.class))).thenReturn(List.of(tag));
        IndicadorReutilizavelService indicadorService = new IndicadorReutilizavelService(indicadorRepository);
        IndicadorReutilizavelController indicadorController = new IndicadorReutilizavelController(indicadorService);

        List<IndicadorReutilizavelController.IndicadorResposta> indResp = indicadorController.listar();
        assertEquals(1, indResp.size());
        assertEquals("TDAH", indResp.getFirst().nome());
    }

    private void assertMethodReadOnlyTransactional(Method method) {
        Transactional tx = method.getAnnotation(Transactional.class);
        if (tx == null) {
            tx = method.getDeclaringClass().getAnnotation(Transactional.class);
        }
        assertNotNull(tx, "O método " + method.getDeclaringClass().getSimpleName() + "." + method.getName()
                + " deve possuir @Transactional");
        assertTrue(tx.readOnly(), "O método de leitura " + method.getDeclaringClass().getSimpleName() + "." + method.getName()
                + " deve possuir @Transactional(readOnly = true)");
    }

    private void assertEntityGraph(Method method, String... expectedPaths) {
        EntityGraph graph = method.getAnnotation(EntityGraph.class);
        assertNotNull(graph, "O método " + method.getDeclaringClass().getSimpleName() + "." + method.getName()
                + " deve possuir @EntityGraph");
        List<String> actualPaths = Arrays.asList(graph.attributePaths());
        for (String expected : expectedPaths) {
            assertTrue(actualPaths.contains(expected),
                    "Esperava attributePath '" + expected + "' em " + method.getDeclaringClass().getSimpleName()
                            + "." + method.getName() + ", mas encontrou: " + actualPaths);
        }
    }
}
