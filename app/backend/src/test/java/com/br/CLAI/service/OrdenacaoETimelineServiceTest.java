package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.dto.response.HistoricoSocioemocionalResponseDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.dto.response.TimelineEventDTO;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Ordenação Determinística e Null-Safety da Timeline e Planos")
class OrdenacaoETimelineServiceTest {

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private IndicadorReutilizavelRepository indicadorRepository;

    @Mock
    private PeiRepository peiRepository;

    @Mock
    private PeaRepository peaRepository;

    @Mock
    private AcompanhamentoRepository acompanhamentoRepository;

    @Mock
    private AnexoEstudanteRepository anexoEstudanteRepository;

    @Mock
    private RbacGuard rbacGuard;

    @Test
    @DisplayName("EstudoDeCasoService e ProntuarioService devem concordar no estudo vigente mais recente")
    void deveOrdenarEstudosPorVigenciaEConsistenciaComProntuario() {
        UUID alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Teste", "2026001");
        aluno.setId(alunoId);

        LocalDateTime t1 = LocalDateTime.of(2026, 1, 10, 10, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 2, 10, 10, 0);
        LocalDateTime t3 = LocalDateTime.of(2026, 3, 10, 10, 0);

        EstudoDeCaso rascunhoMaisNovo = new EstudoDeCaso(aluno, StatusEstudoCaso.RASCUNHO, "Rascunho");
        rascunhoMaisNovo.setId(UUID.randomUUID());
        rascunhoMaisNovo.setCriadoEm(t3);
        rascunhoMaisNovo.setAtualizadoEm(t3);

        EstudoDeCaso encerradoAntigo = new EstudoDeCaso(aluno, StatusEstudoCaso.ENCERRADO, "Encerrado Antigo");
        encerradoAntigo.setId(UUID.randomUUID());
        encerradoAntigo.setCriadoEm(t1);
        encerradoAntigo.setAtualizadoEm(t1);
        encerradoAntigo.setHistoricoFamiliar("Familiar antigo");

        EstudoDeCaso encerradoRecente = new EstudoDeCaso(aluno, StatusEstudoCaso.ENCERRADO, "Encerrado Recente");
        encerradoRecente.setId(UUID.randomUUID());
        encerradoRecente.setCriadoEm(t2);
        encerradoRecente.setAtualizadoEm(t2);
        encerradoRecente.setHistoricoFamiliar("Familiar recente");

        when(alunoRepository.existsById(alunoId)).thenReturn(true);
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(estudoDeCasoRepository.findByAlunoId(alunoId))
                .thenReturn(List.of(encerradoAntigo, rascunhoMaisNovo, encerradoRecente));
        when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId)).thenReturn(List.of());
        when(rbacGuard.podeAcessarDadosSensiveis()).thenReturn(true);

        EstudoDeCasoService estudoService = new EstudoDeCasoService(
                estudoDeCasoRepository,
                alunoRepository,
                indicadorRepository,
                new EstudoDeCasoValidator(),
                new EstudoDeCasoMapper(rbacGuard)
        );
        ProntuarioService prontuarioService = new ProntuarioService(
                alunoRepository,
                estudoDeCasoRepository,
                peiRepository,
                peaRepository,
                anexoEstudanteRepository,
                rbacGuard
        );

        List<EstudoDeCasoResponseDTO> estudos = estudoService.listarPorAluno(alunoId);
        ProntuarioResponseDTO prontuario = prontuarioService.buscarProntuarioPorEstudante(alunoId);
        HistoricoSocioemocionalResponseDTO historico = prontuarioService.buscarHistoricoSocioemocional(alunoId);

        assertEquals(List.of(encerradoRecente.getId(), encerradoAntigo.getId(), rascunhoMaisNovo.getId()),
                estudos.stream().map(EstudoDeCasoResponseDTO::id).toList());
        assertEquals(encerradoRecente.getId(), prontuario.estudoDeCasoId());
        assertEquals(encerradoRecente.getId(), historico.estudoDeCasoId());
        assertEquals("Familiar recente", historico.historicoFamiliar());
    }

    @Test
    @DisplayName("PeiService e PeaService devem retornar planos ordenados do mais recente ao mais antigo")
    void deveOrdenarPeiEPeaDeterministicamente() {
        UUID alunoId = UUID.randomUUID();
        UUID acompId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Teste", "2026002");
        aluno.setId(alunoId);
        Acompanhamento acomp = new Acompanhamento(aluno, LocalDate.of(2026, 1, 1));
        acomp.setId(acompId);

        LocalDateTime t1 = LocalDateTime.of(2026, 1, 1, 9, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 2, 1, 9, 0);

        Pei peiAntigo = new Pei(acomp, "H1", "P1");
        peiAntigo.setId(UUID.randomUUID());
        peiAntigo.setCriadoEm(t1);
        peiAntigo.setAtualizadoEm(t1);

        Pei peiNovo = new Pei(acomp, "H2", "P2");
        peiNovo.setId(UUID.randomUUID());
        peiNovo.setCriadoEm(t2);
        peiNovo.setAtualizadoEm(t2);

        when(peiRepository.findAll()).thenReturn(List.of(peiAntigo, peiNovo));
        when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(peiAntigo, peiNovo));
        when(peiRepository.findByAcompanhamentoId(acompId)).thenReturn(List.of(peiAntigo, peiNovo));

        PeiService peiService = new PeiService(
                peiRepository, acompanhamentoRepository, peaRepository, new PeiMapper(), new PeaMapper());

        assertEquals(List.of(peiNovo.getId(), peiAntigo.getId()),
                peiService.listarTodos().stream().map(PeiResponseDTO::id).toList());
        assertEquals(List.of(peiNovo.getId(), peiAntigo.getId()),
                peiService.listarPorAluno(alunoId).stream().map(PeiResponseDTO::id).toList());
        assertEquals(List.of(peiNovo.getId(), peiAntigo.getId()),
                peiService.listarPorAcompanhamento(acompId).stream().map(PeiResponseDTO::id).toList());

        Pea peaAntigo = new Pea(acomp, null, "Obj1", "Met1", "Aval1");
        peaAntigo.setId(UUID.randomUUID());
        peaAntigo.setCriadoEm(t1);
        peaAntigo.setAtualizadoEm(t2);

        Pea peaNovo = new Pea(acomp, null, "Obj2", "Met2", "Aval2");
        peaNovo.setId(UUID.randomUUID());
        peaNovo.setCriadoEm(t2);
        peaNovo.setAtualizadoEm(t1);

        when(peaRepository.findAll()).thenReturn(List.of(peaAntigo, peaNovo));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(peaAntigo, peaNovo));
        when(peaRepository.findByAcompanhamentoId(acompId)).thenReturn(List.of(peaAntigo, peaNovo));

        PeaService peaService = new PeaService(peaRepository, acompanhamentoRepository, new PeaMapper());

        assertEquals(List.of(peaNovo.getId(), peaAntigo.getId()),
                peaService.listarTodos().stream().map(PeaResponseDTO::id).toList());
        assertEquals(List.of(peaNovo.getId(), peaAntigo.getId()),
                peaService.listarPorAluno(alunoId).stream().map(PeaResponseDTO::id).toList());
        assertEquals(List.of(peaNovo.getId(), peaAntigo.getId()),
                peaService.listarPorAcompanhamento(acompId).stream().map(PeaResponseDTO::id).toList());
    }

    @Test
    @DisplayName("TimelineService deve ordenar cronologicamente sem lançar NullPointerException quando criadoEm for nulo")
    void deveOrdenarTimelineComSegurancaContraNulos() {
        UUID alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Timeline", "2026003");
        aluno.setId(alunoId);
        Acompanhamento acomp = new Acompanhamento(aluno, LocalDate.of(2026, 1, 1));

        EstudoDeCaso estudo = new EstudoDeCaso(aluno, StatusEstudoCaso.ENCERRADO, "Diag");
        estudo.setId(UUID.randomUUID());
        estudo.setCriadoEm(LocalDateTime.of(2026, 1, 5, 12, 0));

        Pei peiSemData = new Pei(acomp, "Hab", "Prop");
        peiSemData.setId(UUID.randomUUID());
        peiSemData.setCriadoEm(null);

        Pea peaMaisAntigo = new Pea(acomp, null, "Obj", "Met", "Aval");
        peaMaisAntigo.setId(UUID.randomUUID());
        peaMaisAntigo.setCriadoEm(LocalDateTime.of(2026, 1, 2, 12, 0));

        when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudo));
        when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(peiSemData));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(peaMaisAntigo));

        TimelineService timelineService = new TimelineService(estudoDeCasoRepository, peiRepository, peaRepository);
        List<TimelineEventDTO> eventos = timelineService.buscarPorAluno(alunoId);

        assertEquals(List.of(peaMaisAntigo.getId(), estudo.getId(), peiSemData.getId()),
                eventos.stream().map(TimelineEventDTO::id).toList());
    }

    @Test
    @DisplayName("PeiService e PeaService devem persistir, atualizar e mapear todos os campos do Anexo III e vincular PEA ao PEI")
    void deveMapearEVincularTodosOsCamposDoAnexoIiiEmPeiEPea() {
        UUID usuarioId = UUID.randomUUID();
        UUID alunoId = UUID.randomUUID();
        UUID acompId = UUID.randomUUID();
        UUID peiId = UUID.randomUUID();
        UUID peaId = UUID.randomUUID();

        Aluno aluno = new Aluno("Carlos Eduardo", "20261500");
        aluno.setId(alunoId);
        aluno.setCurso("Análise e Desenvolvimento de Sistemas");

        Acompanhamento acomp = new Acompanhamento(aluno, LocalDate.of(2026, 2, 1));
        acomp.setId(acompId);

        when(acompanhamentoRepository.findById(acompId)).thenReturn(Optional.of(acomp));

        PeiMapper peiMapper = new PeiMapper();
        PeaMapper peaMapper = new PeaMapper();

        when(peiRepository.save(org.mockito.ArgumentMatchers.any(Pei.class))).thenAnswer(inv -> {
            Pei ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(peiId);
            }
            return ent;
        });

        PeiService peiService = new PeiService(
                peiRepository, acompanhamentoRepository, peaRepository, peiMapper, peaMapper);

        com.br.CLAI.dto.request.PeiRequestDTO peiReq = new com.br.CLAI.dto.request.PeiRequestDTO(
                acompId,
                "2026.1",
                "Estudante ingressou via cota PcD, concluiu ensino médio em escola pública com suporte de AEE.",
                "Baixa visão bilateral. Necessita de materiais ampliados (fonte mín. 18pt), alto contraste e leitor de tela.",
                "Excelente raciocínio lógico, facilidade com programação backend e interesse em acessibilidade web.",
                "Fadiga visual em leituras extensas de diagramas complexos e quadros brancos sem contraste.",
                "Disponibilização prévia de slides digitais acessíveis e dilatação de 50% no tempo de avaliações escritas."
        );

        PeiResponseDTO peiCriado = peiService.criar(peiReq, usuarioId);
        assertEquals(peiId, peiCriado.id());
        assertEquals("2026.1", peiCriado.semestreAno());
        assertEquals(peiReq.historicoEstudante(), peiCriado.historicoEstudante());
        assertEquals(peiReq.necessidadesEspecificas(), peiCriado.necessidadesEspecificas());
        assertEquals(peiReq.habilidadesInteresses(), peiCriado.habilidadesInteresses());
        assertEquals(peiReq.dificuldadesApresentadas(), peiCriado.dificuldadesApresentadas());
        assertEquals(peiReq.propostasAdaptacoes(), peiCriado.propostasAdaptacoes());

        Pei peiEntidade = peiMapper.toEntity(peiReq, acomp);
        peiEntidade.setId(peiId);
        when(peiRepository.findById(peiId)).thenReturn(Optional.of(peiEntidade));
        when(peiRepository.findByAcompanhamentoId(acompId)).thenReturn(List.of(peiEntidade));

        when(peaRepository.save(org.mockito.ArgumentMatchers.any(Pea.class))).thenAnswer(inv -> {
            Pea ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(peaId);
            }
            return ent;
        });

        PeaService peaService = new PeaService(
                peaRepository, acompanhamentoRepository, peiRepository, peaMapper);

        com.br.CLAI.dto.request.PeaRequestDTO peaReq = new com.br.CLAI.dto.request.PeaRequestDTO(
                acompId,
                null, // Deve vincular automaticamente ao PEI vigente do acompanhamento
                null,
                "Banco de Dados I",
                "2026.1",
                "Prof. Dr. Marcos Silva",
                "Compreender e aplicar modelagem relacional e linguagem SQL com autonomia.",
                "Elaborar modelos entidade-relacionamento em formato textual/DDL acessível; construir consultas SQL.",
                "1. Modelo Relacional; 2. Álgebra Relacional; 3. SQL DDL e DML; 4. Normalização.",
                "Uso de scripts DDL textuais em substituição a diagramas exclusivamente visuais e atendimento individualizado.",
                "Projetos práticos em dupla e avaliação prática com leitor de tela e tempo adicional de 50%.",
                "ELMASRI, R.; NAVATHE, S. B. Sistemas de Banco de Dados. 7. ed. São Paulo: Pearson, 2019.",
                "DATE, C. J. Introdução a Sistemas de Bancos de Dados. 8. ed. Rio de Janeiro: Campus, 2004."
        );

        PeaResponseDTO peaCriado = peaService.criar(peaReq, usuarioId);
        assertEquals(peaId, peaCriado.id());
        assertEquals(peiId, peaCriado.peiId());
        assertEquals("Banco de Dados I", peaCriado.componenteCurricular());
        assertEquals("2026.1", peaCriado.semestreAno());
        assertEquals("Prof. Dr. Marcos Silva", peaCriado.docente());
        assertEquals(peaReq.objetivoGeral(), peaCriado.objetivoGeral());
        assertEquals(peaReq.objetivosEspecificos(), peaCriado.objetivosEspecificos());
        assertEquals(peaReq.conteudosProgramaticos(), peaCriado.conteudosProgramaticos());
        assertEquals(peaReq.metodologia(), peaCriado.metodologia());
        assertEquals(peaReq.avaliacao(), peaCriado.avaliacao());
        assertEquals(peaReq.bibliografiaBasica(), peaCriado.bibliografiaBasica());
        assertEquals(peaReq.bibliografiaComplementar(), peaCriado.bibliografiaComplementar());

        Pea peaEntidade = peaMapper.toEntity(peaReq, acomp, peiEntidade);
        peaEntidade.setId(peaId);
        when(peaRepository.findByPeiId(peiId)).thenReturn(List.of(peaEntidade));
        when(peaRepository.findByAcompanhamentoId(acompId)).thenReturn(List.of(peaEntidade));

        List<PeaResponseDTO> peasDoPei = peaService.listarPorPei(peiId);
        assertEquals(1, peasDoPei.size());
        assertEquals("Banco de Dados I", peasDoPei.getFirst().componenteCurricular());
    }
}

