package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Notificacao;
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
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicacaoRepository;
import com.br.CLAI.repository.NotificacaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("US 10 - Integração JPA/Service: Triagem, Notificações da CLAI e Estudo de Caso (open-in-view=false)")
class IndicacaoPersistenciaIntegrationTest {

    @Autowired
    private IndicacaoService indicacaoService;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Autowired
    private IndicacaoRepository indicacaoRepository;

    private Usuario professor;
    private Usuario psicopedagogo;
    private Aluno aluno;

    @BeforeEach
    void setUp() {
        String sufixo = UUID.randomUUID().toString().substring(0, 8);

        professor = new Usuario(
                "Prof. Teste " + sufixo,
                "prof." + sufixo + "@sigi.ifpb.edu.br",
                "hash",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );
        professor = usuarioRepository.saveAndFlush(professor);

        psicopedagogo = new Usuario(
                "Psico CLAI " + sufixo,
                "psico." + sufixo + "@sigi.ifpb.edu.br",
                "hash",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA,
                true
        );
        psicopedagogo = usuarioRepository.saveAndFlush(psicopedagogo);

        aluno = new Aluno("Estudante US10 " + sufixo, "MAT" + sufixo);
        aluno.setCurso("ADS");
        aluno.setTurma("2026.1");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(Boolean.TRUE);
        aluno = alunoRepository.saveAndFlush(aluno);
    }

    @Test
    @DisplayName("TA10.2 + TA10.3: fluxo ponta a ponta de indicação -> EM_TRIAGEM + notificações CLAI -> aprovação inicia Estudo de Caso")
    void fluxoCompletoAprovacaoDevePersistirTriagemNotificacoesEEstudoDeCaso() {
        IndicacaoResponseDTO criada = indicacaoService.criar(
                new IndicacaoRequestDTO(
                        aluno.getId(),
                        "Estudante demonstra barreiras de leitura e foco em avaliações.",
                        List.of("Algoritmos", "Banco de Dados")
                ),
                professor.getId()
        );

        assertNotNull(criada.id());
        assertEquals(StatusIndicacao.PENDENTE, criada.status());
        assertEquals(StatusAluno.EM_TRIAGEM, criada.statusAluno());
        assertEquals(List.of("Algoritmos", "Banco de Dados"), criada.disciplinasObservadas());

        // Confirma atualização real no banco
        Aluno alunoPosIndicacao = alunoRepository.findById(aluno.getId()).orElseThrow();
        assertEquals(StatusAluno.EM_TRIAGEM, alunoPosIndicacao.getStatus());

        // Confirma notificações não lidas para CLAI_PSICOPEDAGOGO e COORDENADOR
        List<Notificacao> notifsPsico = notificacaoRepository
                .findByPerfilDestinatarioAndLidaFalseOrderByCriadoEmDesc(Role.CLAI_PSICOPEDAGOGO.name());
        List<Notificacao> notifsCoord = notificacaoRepository
                .findByPerfilDestinatarioAndLidaFalseOrderByCriadoEmDesc(Role.COORDENADOR.name());

        String linkEsperado = "/api/indicacoes/" + criada.id();
        assertTrue(notifsPsico.stream().anyMatch(n -> linkEsperado.equals(n.getLinkReferencia())),
                "Deve existir notificação não lida para CLAI_PSICOPEDAGOGO");
        assertTrue(notifsCoord.stream().anyMatch(n -> linkEsperado.equals(n.getLinkReferencia())),
                "Deve existir notificação não lida para COORDENADOR");

        // Leitura fora de transação (valida ausência de LazyInitializationException sob open-in-view=false)
        IndicacaoResponseDTO carregada = indicacaoService.buscarPorId(criada.id());
        assertEquals(2, carregada.disciplinasObservadas().size());

        // Aprovação pela CLAI
        IndicacaoResponseDTO aprovada = indicacaoService.aprovar(
                criada.id(),
                new AprovacaoIndicacaoRequestDTO("Indicação acolhida para estudo multidisciplinar."),
                psicopedagogo.getId()
        );

        assertEquals(StatusIndicacao.APROVADA, aprovada.status());
        assertEquals(StatusAluno.ATIVO, aprovada.statusAluno());
        assertNotNull(aprovada.estudoDeCasoId());

        Aluno alunoPosAprovacao = alunoRepository.findById(aluno.getId()).orElseThrow();
        assertEquals(StatusAluno.ATIVO, alunoPosAprovacao.getStatus());

        EstudoDeCaso estudoCriado = estudoDeCasoRepository.findById(aprovada.estudoDeCasoId()).orElseThrow();
        assertEquals(StatusEstudoCaso.RASCUNHO, estudoCriado.getStatus());
        assertEquals(aluno.getId(), estudoCriado.getAluno().getId());
        assertTrue(estudoCriado.getDiagnosticoInicial().contains("Algoritmos"));
    }

    @Test
    @DisplayName("TA10.3: rejeição documentada persiste justificativa e restaura status do estudante")
    void fluxoCompletoRejeicaoDeveRestaurarStatusAluno() {
        IndicacaoResponseDTO criada = indicacaoService.criar(
                new IndicacaoRequestDTO(
                        aluno.getId(),
                        "Ausências pontuais nas primeiras semanas.",
                        List.of("Redes de Computadores")
                ),
                professor.getId()
        );

        assertEquals(StatusAluno.EM_TRIAGEM, alunoRepository.findById(aluno.getId()).orElseThrow().getStatus());

        IndicacaoResponseDTO rejeitada = indicacaoService.rejeitar(
                criada.id(),
                new RejeicaoIndicacaoRequestDTO("Encaminhado para acompanhamento de frequência pela coordenação de curso."),
                psicopedagogo.getId()
        );

        assertEquals(StatusIndicacao.REJEITADA, rejeitada.status());
        assertEquals("Encaminhado para acompanhamento de frequência pela coordenação de curso.",
                rejeitada.justificativaDecisao());
        assertEquals(StatusAluno.ATIVO, alunoRepository.findById(aluno.getId()).orElseThrow().getStatus());

        List<IndicacaoResponseDTO> doAluno = indicacaoService.listarPorAluno(aluno.getId());
        assertFalse(doAluno.isEmpty());
        assertEquals(StatusIndicacao.REJEITADA, doAluno.get(0).status());
        assertTrue(indicacaoRepository.findDetalhadaById(criada.id()).isPresent());
    }
}
