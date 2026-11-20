package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.domain.enums.TipoAtendimento;
import com.br.CLAI.dto.request.AtendimentoRequestDTO;
import com.br.CLAI.dto.request.AtendimentoUpdateDTO;
import com.br.CLAI.dto.response.AtendimentoResponseDTO;
import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.AtendimentoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtendimentoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 04 - Atendimento: registro, trava de edição de 24h e autoria")
class AtendimentoServiceTest {

    private static final ZoneId ZONA = ZoneId.of("America/Fortaleza");
    private static final LocalDateTime CRIADO_EM = LocalDateTime.of(2026, 3, 10, 9, 0);

    @Mock
    private AtendimentoRepository repository;

    @Mock
    private AlunoRepository alunoRepository;

    private final AtendimentoMapper mapper = new AtendimentoMapper();

    private UUID autorId;
    private UUID alunoId;
    private Aluno aluno;
    private Atendimento atendimento;
    private UUID atendimentoId;

    @BeforeEach
    void setUp() {
        autorId = UUID.randomUUID();
        alunoId = UUID.randomUUID();
        atendimentoId = UUID.randomUUID();

        aluno = new Aluno("Estudante Teste", "2026100");
        aluno.setId(alunoId);

        atendimento = new Atendimento(
                aluno, TipoAtendimento.PEDAGOGICO, LocalDate.of(2026, 3, 10),
                "Psicopedagogia CLAI", "Relato original", "Retorno em 15 dias");
        atendimento.setId(atendimentoId);
        atendimento.setCriadoEm(CRIADO_EM);
        atendimento.setCriadoPor(autorId);
    }

    private AtendimentoService serviceEm(LocalDateTime agora) {
        Clock clock = Clock.fixed(agora.atZone(ZONA).toInstant(), ZONA);
        return new AtendimentoService(repository, alunoRepository, mapper, clock);
    }

    private AtendimentoUpdateDTO dtoEdicao() {
        return new AtendimentoUpdateDTO(
                TipoAtendimento.PSICOLOGICO, LocalDate.of(2026, 3, 10),
                "Psicologia CLAI", "  Relato corrigido  ", null);
    }

    // ---------------------------------------------------------------- criação

    @Test
    @DisplayName("criar deve gravar o usuário autenticado como autor e devolver o fim da janela de 24h")
    void criarDeveRegistrarAutoriaEPrazoDeEdicao() {
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(repository.save(any(Atendimento.class))).thenAnswer(inv -> {
            Atendimento salvo = inv.getArgument(0);
            salvo.setId(atendimentoId);
            salvo.setCriadoEm(CRIADO_EM);
            return salvo;
        });

        AtendimentoRequestDTO req = new AtendimentoRequestDTO(
                alunoId, TipoAtendimento.PEDAGOGICO, LocalDate.of(2026, 3, 10),
                " Psicopedagogia CLAI ", " Relato original ", "   ");

        AtendimentoResponseDTO resp = serviceEm(CRIADO_EM).criar(req, autorId);

        assertEquals(autorId, resp.criadoPor());
        assertEquals(alunoId, resp.alunoId());
        assertEquals("2026100", resp.matriculaAluno());
        assertEquals("Psicopedagogia CLAI", resp.profissionalResponsavel());
        assertEquals("Relato original", resp.descricao());
        assertNull(resp.encaminhamentos(), "encaminhamentos em branco deve ser normalizado para nulo");
        assertEquals(CRIADO_EM.plusHours(24), resp.edicaoPermitidaAte());
    }

    @Test
    @DisplayName("criar deve falhar com 404 quando o estudante não existe")
    void criarDeveFalharQuandoAlunoNaoExiste() {
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.empty());

        AtendimentoRequestDTO req = new AtendimentoRequestDTO(
                alunoId, TipoAtendimento.PEDAGOGICO, LocalDate.of(2026, 3, 10), "Prof", "Relato", null);

        assertThrows(NaoEncontradoException.class, () -> serviceEm(CRIADO_EM).criar(req, autorId));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("criar deve exigir usuário autenticado")
    void criarDeveExigirUsuario() {
        AtendimentoRequestDTO req = new AtendimentoRequestDTO(
                alunoId, TipoAtendimento.PEDAGOGICO, LocalDate.of(2026, 3, 10), "Prof", "Relato", null);

        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> serviceEm(CRIADO_EM).criar(req, null));
    }

    // ------------------------------------------------------ edição: caminho feliz

    @Test
    @DisplayName("autor pode editar dentro das 24h e atualizadoPor é registrado")
    void autorPodeEditarDentroDaJanela() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));
        when(repository.save(any(Atendimento.class))).thenAnswer(inv -> inv.getArgument(0));

        AtendimentoResponseDTO resp = serviceEm(CRIADO_EM.plusHours(23).plusMinutes(59))
                .atualizar(atendimentoId, dtoEdicao(), autorId);

        assertEquals("Relato corrigido", resp.descricao());
        assertEquals(TipoAtendimento.PSICOLOGICO, resp.tipoAtendimento());
        assertNull(resp.encaminhamentos());
        assertEquals(autorId, atendimento.getAtualizadoPor());
        assertEquals(autorId, atendimento.getCriadoPor(), "a autoria original nunca muda");
        verify(repository).save(atendimento);
    }

    @Test
    @DisplayName("no instante exato de criadoEm + 24h a edição ainda é permitida (limite inclusivo)")
    void bordaExataDas24hAindaPermite() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));
        when(repository.save(any(Atendimento.class))).thenAnswer(inv -> inv.getArgument(0));

        AtendimentoResponseDTO resp = serviceEm(CRIADO_EM.plusHours(24))
                .atualizar(atendimentoId, dtoEdicao(), autorId);

        assertEquals("Relato corrigido", resp.descricao());
    }

    // ------------------------------------------------------ edição: 403

    @Test
    @DisplayName("um segundo depois das 24h a edição é negada (403) e nada é gravado")
    void foraDaJanelaDeveRetornar403() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));

        AcessoNegadoException ex = assertThrows(AcessoNegadoException.class,
                () -> serviceEm(CRIADO_EM.plusHours(24).plusSeconds(1))
                        .atualizar(atendimentoId, dtoEdicao(), autorId));

        assertEquals("O prazo de 24 horas para edição do relatório deste atendimento foi encerrado.",
                ex.getMessage());
        assertEquals("Relato original", atendimento.getDescricao());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("outro usuário é negado (403) mesmo dentro da janela de 24h")
    void naoAutorDeveRetornar403DentroDaJanela() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));

        UUID outroUsuario = UUID.randomUUID();

        AcessoNegadoException ex = assertThrows(AcessoNegadoException.class,
                () -> serviceEm(CRIADO_EM.plusHours(1)).atualizar(atendimentoId, dtoEdicao(), outroUsuario));

        assertEquals("Somente o autor do atendimento pode editar o relatório.", ex.getMessage());
        assertEquals("Relato original", atendimento.getDescricao());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("não autor fora da janela recebe a mensagem de autoria, sem revelar o estado do prazo")
    void naoAutorForaDaJanelaRecebeMensagemDeAutoria() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));

        AcessoNegadoException ex = assertThrows(AcessoNegadoException.class,
                () -> serviceEm(CRIADO_EM.plusDays(10))
                        .atualizar(atendimentoId, dtoEdicao(), UUID.randomUUID()));

        assertEquals("Somente o autor do atendimento pode editar o relatório.", ex.getMessage());
    }

    @Test
    @DisplayName("registro sem autor (legado) nunca pode ser editado")
    void registroSemAutorEhNegado() {
        atendimento.setCriadoPor(null);
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));

        assertThrows(AcessoNegadoException.class,
                () -> serviceEm(CRIADO_EM.plusHours(1)).atualizar(atendimentoId, dtoEdicao(), autorId));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("registro sem criadoEm é negado: sem marco temporal a janela não pode ser provada")
    void registroSemCriadoEmEhNegado() {
        atendimento.setCriadoEm(null);
        when(repository.findById(atendimentoId)).thenReturn(Optional.of(atendimento));

        assertThrows(AcessoNegadoException.class,
                () -> serviceEm(CRIADO_EM).atualizar(atendimentoId, dtoEdicao(), autorId));
        verify(repository, never()).save(any());
    }

    // ------------------------------------------------------ edição: demais erros

    @Test
    @DisplayName("editar atendimento inexistente (ou excluído logicamente) retorna 404")
    void editarInexistenteRetorna404() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class,
                () -> serviceEm(CRIADO_EM).atualizar(atendimentoId, dtoEdicao(), autorId));
    }

    @Test
    @DisplayName("editar exige usuário autenticado (401, não 403)")
    void editarExigeUsuario() {
        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> serviceEm(CRIADO_EM).atualizar(atendimentoId, dtoEdicao(), null));
    }

    // ------------------------------------------------------------- consultas

    @Test
    @DisplayName("listarPorAluno devolve do mais recente para o mais antigo")
    void listarPorAlunoOrdenaPorCriacaoDesc() {
        Atendimento antigo = new Atendimento(
                aluno, TipoAtendimento.PEDAGOGICO, LocalDate.of(2026, 3, 1), "P", "Antigo", null);
        antigo.setId(UUID.randomUUID());
        antigo.setCriadoEm(LocalDateTime.of(2026, 3, 1, 8, 0));
        antigo.setCriadoPor(autorId);

        when(repository.findByAlunoId(alunoId)).thenReturn(List.of(antigo, atendimento));

        List<UUID> ids = serviceEm(CRIADO_EM).listarPorAluno(alunoId).stream()
                .map(AtendimentoResponseDTO::id).toList();

        assertEquals(List.of(atendimentoId, antigo.getId()), ids);
    }

    @Test
    @DisplayName("buscarPorId inexistente retorna 404")
    void buscarPorIdInexistente() {
        when(repository.findById(atendimentoId)).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class, () -> serviceEm(CRIADO_EM).buscarPorId(atendimentoId));
    }
}
