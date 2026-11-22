package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Indicacao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.domain.enums.StatusIndicacao;
import com.br.CLAI.dto.request.AprovacaoIndicacaoRequestDTO;
import com.br.CLAI.dto.request.IndicacaoRequestDTO;
import com.br.CLAI.dto.request.RejeicaoIndicacaoRequestDTO;
import com.br.CLAI.dto.response.IndicacaoResponseDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.IndicacaoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.IndicacaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 10 - IndicacaoService: demanda espontânea, triagem, notificações e decisão CLAI")
class IndicacaoServiceTest {

    private static final ZoneId ZONA = ZoneId.of("America/Fortaleza");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 4, 15, 10, 30);

    @Mock
    private IndicacaoRepository indicacaoRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private NotificacaoService notificacaoService;

    @Mock
    private EstudoDeCasoService estudoDeCasoService;

    private IndicacaoService service;

    private UUID alunoId;
    private UUID professorId;
    private UUID claiId;
    private UUID indicacaoId;
    private Aluno aluno;
    private Usuario professor;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AGORA.atZone(ZONA).toInstant(), ZONA);
        service = new IndicacaoService(
                indicacaoRepository,
                alunoRepository,
                usuarioRepository,
                notificacaoService,
                estudoDeCasoService,
                new IndicacaoMapper(),
                clock
        );

        alunoId = UUID.randomUUID();
        professorId = UUID.randomUUID();
        claiId = UUID.randomUUID();
        indicacaoId = UUID.randomUUID();

        aluno = new Aluno("Lucas Ferreira", "20261010");
        aluno.setId(alunoId);
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(Boolean.TRUE);

        professor = new Usuario(
                "Prof. Carlos Silva",
                "carlos@sigi.ifpb.edu.br",
                "hash",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );
        professor.setId(professorId);
    }

    @Test
    @DisplayName("TA10.2: criar indicação válida muda status do aluno para EM_TRIAGEM e notifica CLAI_PSICOPEDAGOGO e COORDENADOR")
    void criarIndicacaoValidaDeveColocarAlunoEmTriagemENotificarEquipeClai() {
        when(usuarioRepository.findById(professorId)).thenReturn(Optional.of(professor));
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(alunoRepository.save(any(Aluno.class))).thenAnswer(inv -> inv.getArgument(0));
        when(indicacaoRepository.save(any(Indicacao.class))).thenAnswer(inv -> {
            Indicacao salva = inv.getArgument(0);
            salva.setId(indicacaoId);
            salva.setCriadoEm(AGORA);
            return salva;
        });
        when(notificacaoService.criarNotificacao(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new NotificacaoResponseDTO());

        IndicacaoRequestDTO req = new IndicacaoRequestDTO(
                alunoId,
                "  Dificuldade recorrente na resolução de problemas lógicos e leitura de enunciados.  ",
                List.of(" Matemática ", "Algoritmos", "Matemática")
        );

        IndicacaoResponseDTO resp = service.criar(req, professorId);

        assertEquals(indicacaoId, resp.id());
        assertEquals(StatusIndicacao.PENDENTE, resp.status());
        assertEquals(StatusAluno.EM_TRIAGEM, resp.statusAluno());
        assertEquals(StatusAluno.EM_TRIAGEM, aluno.getStatus());
        assertEquals(List.of("Matemática", "Algoritmos"), resp.disciplinasObservadas());
        assertEquals("Dificuldade recorrente na resolução de problemas lógicos e leitura de enunciados.",
                resp.justificativaPedagogica());

        verify(alunoRepository).save(aluno);
        verify(notificacaoService).criarNotificacao(
                eq("CLAI_PSICOPEDAGOGO"),
                contains("Lucas Ferreira"),
                contains("Matemática, Algoritmos"),
                eq("/api/indicacoes/" + indicacaoId)
        );
        verify(notificacaoService).criarNotificacao(
                eq("COORDENADOR"),
                contains("Lucas Ferreira"),
                contains("20261010"),
                eq("/api/indicacoes/" + indicacaoId)
        );
    }

    @Test
    @DisplayName("TA10.1: criar indicação sem justificativa ou sem disciplinas deve lançar RegraDeNegocioException")
    void criarIndicacaoSemCamposObrigatoriosDeveFalhar() {
        IndicacaoRequestDTO semJustificativa = new IndicacaoRequestDTO(
                alunoId, "   ", List.of("Física")
        );
        assertThrows(RegraDeNegocioException.class, () -> service.criar(semJustificativa, professorId));

        IndicacaoRequestDTO semDisciplinas = new IndicacaoRequestDTO(
                alunoId, "Justificativa válida", List.of()
        );
        assertThrows(RegraDeNegocioException.class, () -> service.criar(semDisciplinas, professorId));

        IndicacaoRequestDTO disciplinaEmBranco = new IndicacaoRequestDTO(
                alunoId, "Justificativa válida", List.of("   ")
        );
        assertThrows(RegraDeNegocioException.class, () -> service.criar(disciplinaEmBranco, professorId));

        verifyNoInteractions(notificacaoService);
    }

    @Test
    @DisplayName("Não deve permitir indicar estudante inativo ou evadido")
    void criarIndicacaoParaAlunoInativoDeveFalhar() {
        aluno.setStatus(StatusAluno.INATIVO);
        aluno.setAtivo(Boolean.FALSE);

        when(usuarioRepository.findById(professorId)).thenReturn(Optional.of(professor));
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));

        IndicacaoRequestDTO req = new IndicacaoRequestDTO(
                alunoId, "Justificativa válida", List.of("Português")
        );

        assertThrows(RegraDeNegocioException.class, () -> service.criar(req, professorId));
        verify(indicacaoRepository, never()).save(any());
        verifyNoInteractions(notificacaoService);
    }

    @Test
    @DisplayName("TA10.3: aprovar indicação muda status para APROVADA, restaura aluno para ATIVO e inicia Estudo de Caso")
    void aprovarIndicacaoDeveRestaurarAlunoEIniciarEstudoDeCaso() {
        aluno.setStatus(StatusAluno.EM_TRIAGEM);
        Indicacao pendente = new Indicacao(
                aluno, professor, "Barreiras em leitura técnica", List.of("Português", "História"), StatusAluno.ATIVO
        );
        pendente.setId(indicacaoId);

        UUID estudoId = UUID.randomUUID();
        EstudoDeCaso rascunho = new EstudoDeCaso(aluno, StatusEstudoCaso.RASCUNHO, "Iniciado");
        rascunho.setId(estudoId);

        when(indicacaoRepository.findDetalhadaById(indicacaoId)).thenReturn(Optional.of(pendente));
        when(alunoRepository.save(any(Aluno.class))).thenAnswer(inv -> inv.getArgument(0));
        when(estudoDeCasoService.iniciarRascunhoPorIndicacao(eq(aluno), anyString(), eq(claiId)))
                .thenReturn(rascunho);
        when(indicacaoRepository.save(any(Indicacao.class))).thenAnswer(inv -> inv.getArgument(0));

        IndicacaoResponseDTO resp = service.aprovar(
                indicacaoId, new AprovacaoIndicacaoRequestDTO("Triagem confirmada pela equipe CLAI"), claiId);

        assertEquals(StatusIndicacao.APROVADA, resp.status());
        assertEquals(StatusAluno.ATIVO, aluno.getStatus());
        assertEquals(StatusAluno.ATIVO, resp.statusAluno());
        assertEquals(estudoId, resp.estudoDeCasoId());
        assertEquals("Triagem confirmada pela equipe CLAI", resp.justificativaDecisao());
        assertEquals(claiId, resp.decididoPor());
        assertEquals(AGORA, resp.decididoEm());

        verify(estudoDeCasoService).iniciarRascunhoPorIndicacao(
                eq(aluno),
                contains("Português, História"),
                eq(claiId)
        );
    }

    @Test
    @DisplayName("TA10.3: rejeitar indicação exige justificativa e restaura status do aluno quando não há outra pendente")
    void rejeitarIndicacaoComJustificativaDeveRestaurarStatusAluno() {
        aluno.setStatus(StatusAluno.EM_TRIAGEM);
        Indicacao pendente = new Indicacao(
                aluno, professor, "Queda pontual de rendimento", List.of("Química"), StatusAluno.ATIVO
        );
        pendente.setId(indicacaoId);

        when(indicacaoRepository.findDetalhadaById(indicacaoId)).thenReturn(Optional.of(pendente));
        when(indicacaoRepository.existsByAlunoIdAndStatusAndIdNot(alunoId, StatusIndicacao.PENDENTE, indicacaoId))
                .thenReturn(false);
        when(alunoRepository.save(any(Aluno.class))).thenAnswer(inv -> inv.getArgument(0));
        when(indicacaoRepository.save(any(Indicacao.class))).thenAnswer(inv -> inv.getArgument(0));

        IndicacaoResponseDTO resp = service.rejeitar(
                indicacaoId,
                new RejeicaoIndicacaoRequestDTO("  Dificuldade pontual atendida em monitoria regular.  "),
                claiId
        );

        assertEquals(StatusIndicacao.REJEITADA, resp.status());
        assertEquals("Dificuldade pontual atendida em monitoria regular.", resp.justificativaDecisao());
        assertEquals(StatusAluno.ATIVO, aluno.getStatus());
        assertNull(resp.estudoDeCasoId());
        verifyNoInteractions(estudoDeCasoService);
    }

    @Test
    @DisplayName("TA10.3: rejeitar indicação mantendo aluno EM_TRIAGEM se existir outra indicação pendente")
    void rejeitarIndicacaoComOutraPendenteDeveManterAlunoEmTriagem() {
        aluno.setStatus(StatusAluno.EM_TRIAGEM);
        Indicacao pendente = new Indicacao(
                aluno, professor, "Justificativa", List.of("Biologia"), StatusAluno.ATIVO
        );
        pendente.setId(indicacaoId);

        when(indicacaoRepository.findDetalhadaById(indicacaoId)).thenReturn(Optional.of(pendente));
        when(indicacaoRepository.existsByAlunoIdAndStatusAndIdNot(alunoId, StatusIndicacao.PENDENTE, indicacaoId))
                .thenReturn(true);
        when(indicacaoRepository.save(any(Indicacao.class))).thenAnswer(inv -> inv.getArgument(0));

        IndicacaoResponseDTO resp = service.rejeitar(
                indicacaoId, new RejeicaoIndicacaoRequestDTO("Indicação duplicada."), claiId);

        assertEquals(StatusIndicacao.REJEITADA, resp.status());
        assertEquals(StatusAluno.EM_TRIAGEM, aluno.getStatus());
        verify(alunoRepository, never()).save(any());
    }

    @Test
    @DisplayName("TA10.3: rejeitar indicação sem justificativa documentada deve lançar RegraDeNegocioException")
    void rejeitarSemJustificativaDeveFalhar() {
        assertThrows(RegraDeNegocioException.class,
                () -> service.rejeitar(indicacaoId, new RejeicaoIndicacaoRequestDTO("   "), claiId));
        assertThrows(RegraDeNegocioException.class,
                () -> service.rejeitar(indicacaoId, null, claiId));
        verify(indicacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Não deve permitir aprovar ou rejeitar indicação já decidida")
    void naoDevePermitirDecidirIndicacaoJaFinalizada() {
        Indicacao jaAprovada = new Indicacao(
                aluno, professor, "Justificativa", List.of("Física"), StatusAluno.ATIVO
        );
        jaAprovada.setId(indicacaoId);
        jaAprovada.setStatus(StatusIndicacao.APROVADA);

        when(indicacaoRepository.findDetalhadaById(indicacaoId)).thenReturn(Optional.of(jaAprovada));

        assertThrows(RegraDeNegocioException.class, () -> service.aprovar(indicacaoId, null, claiId));
        assertThrows(RegraDeNegocioException.class,
                () -> service.rejeitar(indicacaoId, new RejeicaoIndicacaoRequestDTO("Motivo"), claiId));
    }

    @Test
    @DisplayName("Buscar indicação inexistente deve lançar NaoEncontradoException")
    void buscarPorIdInexistenteDeveFalhar404() {
        when(indicacaoRepository.findDetalhadaById(indicacaoId)).thenReturn(Optional.empty());
        assertThrows(NaoEncontradoException.class, () -> service.buscarPorId(indicacaoId));
        assertNotNull(service);
    }
}
