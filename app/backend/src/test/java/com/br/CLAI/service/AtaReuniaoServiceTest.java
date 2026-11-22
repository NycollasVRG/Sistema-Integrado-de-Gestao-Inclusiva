package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.StatusCompromisso;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.request.AtaAssinaturaRequestDTO;
import com.br.CLAI.dto.request.AtaAssinaturasRequestDTO;
import com.br.CLAI.dto.request.AtaCompromissoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoUpdateDTO;
import com.br.CLAI.dto.request.TermoAditivoRequestDTO;
import com.br.CLAI.dto.response.AtaCompromissoResponseDTO;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.dto.response.TermoAditivoResponseDTO;
import com.br.CLAI.exception.AtaFinalizadaException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtaReuniaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 08 - Regras de Negócio da Ata de Reunião (TA8.1 / TA8.4)")
class AtaReuniaoServiceTest {

    private static final String TEST_AES_KEY = "0123456789abcdef0123456789abcdef";

    @TempDir
    Path tempVolumeDir;

    @Mock
    private AtaReuniaoRepository ataReuniaoRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private CryptoStorageService cryptoStorageService;
    private AtaReuniaoService service;

    private UUID usuarioId;
    private UUID alunoId;
    private Aluno aluno;
    private Usuario responsavel;
    private Clock clockFixo;

    @BeforeEach
    void setUp() {
        clockFixo = Clock.fixed(Instant.parse("2026-11-22T14:00:00Z"), ZoneOffset.UTC);
        cryptoStorageService = new CryptoStorageService(TEST_AES_KEY, tempVolumeDir.toString());
        service = new AtaReuniaoService(
                ataReuniaoRepository,
                alunoRepository,
                usuarioRepository,
                cryptoStorageService,
                clockFixo
        );

        usuarioId = UUID.randomUUID();
        alunoId = UUID.randomUUID();
        aluno = new Aluno("Maria Clara Santos", "20261001");
        aluno.setId(alunoId);

        responsavel = new Usuario("Prof. Carlos", "carlos@sigi.ifpb.edu.br", "hash",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        responsavel.setId(UUID.randomUUID());

        lenient().when(ataReuniaoRepository.save(any(AtaReuniao.class))).thenAnswer(inv -> {
            AtaReuniao ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(UUID.randomUUID());
            }
            ent.getCompromissos().forEach(c -> {
                if (c.getId() == null) {
                    c.setId(UUID.randomUUID());
                }
            });
            ent.getAssinaturas().forEach(a -> {
                if (a.getId() == null) {
                    a.setId(UUID.randomUUID());
                }
            });
            ent.getTermosAditivos().forEach(t -> {
                if (t.getId() == null) {
                    t.setId(UUID.randomUUID());
                }
            });
            return ent;
        });
    }

    @Test
    @DisplayName("Deve criar ata em RASCUNHO com compromissos vinculados ao estudante e responsável ativo")
    void deveCriarAtaEmRascunhoComCompromissos() {
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(usuarioRepository.findById(responsavel.getId())).thenReturn(Optional.of(responsavel));

        AtaReuniaoRequestDTO dto = new AtaReuniaoRequestDTO(
                alunoId,
                TipoReuniao.ALINHAMENTO_FAMILIA,
                LocalDateTime.of(2026, 11, 20, 10, 0),
                "Sala da CLAI",
                "Alinhamento sobre adaptações avaliativas",
                "Ficou acordado tempo adicional de 50% nas avaliações.",
                List.of(new AtaCompromissoRequestDTO(
                        "Adaptar prova de Matemática",
                        responsavel.getId(),
                        LocalDate.of(2026, 11, 25)
                ))
        );

        AtaReuniaoResponseDTO response = service.criar(dto, usuarioId);

        assertNotNull(response.id());
        assertEquals(StatusAta.RASCUNHO, response.status());
        assertEquals(alunoId, response.alunoId());
        assertEquals(1, response.compromissos().size());
        assertEquals(StatusCompromisso.PENDENTE, response.compromissos().getFirst().status());
        assertFalse(response.documentoAssinadoAnexado());
    }

    @Test
    @DisplayName("TA8.1: Upload de documento assinado cifra em repouso e download devolve bytes originais")
    void deveCifrarDocumentoAssinadoEmRepousoEDecifrarNoDownload() throws Exception {
        AtaReuniao ata = criarEntidadeRascunho();
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        byte[] pdfBytes = "%PDF-1.7\nATA ASSINADA CONFIDENCIAL DA FAMILIA\n%%EOF".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo", "ata_assinada.pdf", "application/pdf", pdfBytes);

        AtaReuniaoResponseDTO atualizada = service.anexarDocumentoAssinado(ata.getId(), arquivo, usuarioId);

        assertTrue(atualizada.documentoAssinadoAnexado());
        assertEquals("ata_assinada.pdf", atualizada.documentoNomeOriginal());
        assertNotNull(ata.getDocumentoCaminho());
        assertNotNull(ata.getDocumentoIv());

        Path caminhoDisco = cryptoStorageService.resolverCaminhoSeguro(ata.getDocumentoCaminho());
        byte[] bytesDisco = Files.readAllBytes(caminhoDisco);
        assertFalse(new String(bytesDisco, StandardCharsets.UTF_8).contains("ATA ASSINADA CONFIDENCIAL"));

        AtaReuniaoService.DocumentoDownloadPayload download = service.baixarDocumentoAssinado(ata.getId());
        assertArrayEquals(pdfBytes, download.conteudo());
        assertEquals("application/pdf", download.contentType());
    }

    @Test
    @DisplayName("TA8.1: Finalizar exige documento assinado ou assinatura digital e rejeita conteúdo adulterado após assinatura")
    void deveValidarRequisitoDeAssinaturaEIntegridadeNaFinalizacao() {
        AtaReuniao ata = criarEntidadeRascunho();
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        // Sem documento nem assinatura -> erro 400
        assertThrows(RegraDeNegocioException.class, () -> service.finalizar(ata.getId(), usuarioId));

        // Coleta assinatura digital
        service.registrarAssinaturas(
                ata.getId(),
                new AtaAssinaturasRequestDTO(List.of(
                        new AtaAssinaturaRequestDTO("Ana Paula (Mãe)", "Responsável Legal", null)
                )),
                usuarioId,
                "192.168.0.10"
        );
        assertEquals(1, ata.getAssinaturas().size());
        assertEquals(64, ata.getAssinaturas().getFirst().getHashConteudo().length());

        // Altera pauta após assinatura -> hash diverge -> bloqueia finalização
        service.atualizar(
                ata.getId(),
                new AtaReuniaoUpdateDTO(
                        TipoReuniao.PEDAGOGICA,
                        ata.getDataReuniao(),
                        ata.getLocalReuniao(),
                        "Pauta modificada após assinatura",
                        ata.getDeliberacoes(),
                        List.of()
                ),
                usuarioId
        );
        assertThrows(RegraDeNegocioException.class, () -> service.finalizar(ata.getId(), usuarioId));
    }

    @Test
    @DisplayName("TA8.4: Ata FINALIZADA bloqueia PUT com AtaFinalizadaException e permite apenas Termo Aditivo explicativo")
    void deveBloquearPutEmAtaFinalizadaEPermitirTermoAditivo() {
        AtaReuniao ata = criarEntidadeRascunho();
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        // Termo aditivo em RASCUNHO é recusado
        assertThrows(RegraDeNegocioException.class, () -> service.adicionarTermoAditivo(
                ata.getId(), new TermoAditivoRequestDTO("Retificação"), usuarioId));

        // Registra assinatura e finaliza
        service.registrarAssinaturas(
                ata.getId(),
                new AtaAssinaturasRequestDTO(List.of(
                        new AtaAssinaturaRequestDTO("Coordenadora CLAI", "Coordenação", null)
                )),
                usuarioId,
                "127.0.0.1"
        );

        AtaReuniaoResponseDTO finalizada = service.finalizar(ata.getId(), usuarioId);
        assertEquals(StatusAta.FINALIZADA, finalizada.status());
        assertNotNull(finalizada.finalizadaEm());

        // Tentar PUT em ata FINALIZADA -> AtaFinalizadaException (HTTP 409)
        AtaReuniaoUpdateDTO updateDto = new AtaReuniaoUpdateDTO(
                TipoReuniao.PEDAGOGICA,
                ata.getDataReuniao(),
                "Outro local",
                "Tentativa de alteração indevida",
                null,
                List.of()
        );
        AtaFinalizadaException ex = assertThrows(
                AtaFinalizadaException.class,
                () -> service.atualizar(ata.getId(), updateDto, usuarioId)
        );
        assertEquals(ata.getId(), ex.getAtaId());

        // Emitir Termo Aditivo explicativo -> permitido
        TermoAditivoResponseDTO termo = service.adicionarTermoAditivo(
                ata.getId(),
                new TermoAditivoRequestDTO("Retifica-se a data do compromisso de entrega do material adaptado."),
                usuarioId
        );
        assertNotNull(termo.id());
        assertEquals(ata.getId(), termo.ataId());
        assertEquals(1, service.listarTermosAditivos(ata.getId()).size());
    }

    @Test
    @DisplayName("Concluir compromisso é permitido mesmo após a ata ser FINALIZADA")
    void devePermitirConcluirCompromissoEmAtaFinalizada() {
        AtaReuniao ata = criarEntidadeRascunho();
        ata.setStatus(StatusAta.FINALIZADA);
        ata.setFinalizadaEm(LocalDateTime.now(clockFixo));
        com.br.CLAI.domain.AtaCompromisso compromisso = new com.br.CLAI.domain.AtaCompromisso(
                ata, "Enviar relatório", responsavel, LocalDate.of(2026, 11, 24));
        compromisso.setId(UUID.randomUUID());
        ata.adicionarCompromisso(compromisso);

        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        AtaCompromissoResponseDTO concluido = service.concluirCompromisso(ata.getId(), compromisso.getId(), usuarioId);
        assertEquals(StatusCompromisso.CONCLUIDO, concluido.status());
    }

    private AtaReuniao criarEntidadeRascunho() {
        AtaReuniao ata = new AtaReuniao(
                aluno,
                TipoReuniao.PEDAGOGICA,
                LocalDateTime.of(2026, 11, 20, 10, 0),
                "Sala 02",
                "Pauta original",
                "Deliberações iniciais"
        );
        ata.setId(UUID.randomUUID());
        ata.setCriadoPor(usuarioId);
        ata.setAtualizadoPor(usuarioId);
        return ata;
    }
}
