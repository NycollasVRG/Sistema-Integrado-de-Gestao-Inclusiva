package com.br.CLAI.controller;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtaReuniaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.AtaReuniaoService;
import com.br.CLAI.service.CryptoStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 08 - Contrato HTTP do AtaReuniaoController (TA8.1 / TA8.4 RFC 9457)")
class AtaReuniaoControllerTest {

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
    private AtaReuniaoService ataReuniaoService;
    private MockMvc mockMvc;

    private Usuario coordenador;
    private Aluno aluno;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-22T15:00:00Z"), ZoneOffset.UTC);
        cryptoStorageService = new CryptoStorageService(TEST_AES_KEY, tempVolumeDir.toString());
        ataReuniaoService = new AtaReuniaoService(
                ataReuniaoRepository, alunoRepository, usuarioRepository, cryptoStorageService, clock);

        AtaReuniaoController controller = new AtaReuniaoController(ataReuniaoService, new RbacGuard());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        coordenador = new Usuario("Coord CLAI", "coord@sigi.ifpb.edu.br", "hash",
                Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO, true);
        coordenador.setId(UUID.randomUUID());

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                coordenador, null, coordenador.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        aluno = new Aluno("Estudante Teste", "20264001");
        aluno.setId(UUID.randomUUID());

        lenient().when(ataReuniaoRepository.save(any(AtaReuniao.class))).thenAnswer(inv -> {
            AtaReuniao ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(UUID.randomUUID());
            }
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

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("TA8.1: Upload multipart de ata assinada cifra arquivo no volume e download retorna bytes originais")
    void deveFazerUploadCifradoEDownloadDoDocumentoAssinado() throws Exception {
        AtaReuniao ata = novaAtaRascunho();
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        byte[] pdfBytes = "%PDF-1.7\nCONTEUDO ASSINADO DA ATA\n%%EOF".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "arquivo", "ata_reuniao.pdf", MediaType.APPLICATION_PDF_VALUE, pdfBytes);

        mockMvc.perform(multipart("/api/atas/{id}/documento-assinado", ata.getId()).file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentoAssinadoAnexado").value(true))
                .andExpect(jsonPath("$.documentoNomeOriginal").value("ata_reuniao.pdf"));

        byte[] bytesEmDisco = Files.readAllBytes(cryptoStorageService.resolverCaminhoSeguro(ata.getDocumentoCaminho()));
        assertFalse(new String(bytesEmDisco, StandardCharsets.UTF_8).contains("CONTEUDO ASSINADO DA ATA"));

        mockMvc.perform(get("/api/atas/{id}/documento-assinado", ata.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfBytes));
    }

    @Test
    @DisplayName("TA8.1: POST /api/atas/{id}/assinaturas registra assinaturas digitais e retorna 201")
    void deveRegistrarAssinaturasDigitais() throws Exception {
        AtaReuniao ata = novaAtaRascunho();
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        String payload = """
                {
                  "assinaturas": [
                    { "nomeParticipante": "Maria Silva (Mãe)", "papelParticipante": "Responsável Legal" },
                    { "nomeParticipante": "Coord CLAI", "papelParticipante": "Coordenação" }
                  ]
                }
                """;

        mockMvc.perform(post("/api/atas/{id}/assinaturas", ata.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assinaturas.length()").value(2))
                .andExpect(jsonPath("$.assinaturas[0].nomeParticipante").value("Maria Silva (Mãe)"))
                .andExpect(jsonPath("$.assinaturas[0].hashConteudo").isNotEmpty());
    }

    @Test
    @DisplayName("TA8.4: PUT em ata FINALIZADA retorna HTTP 409 RFC 9457 (ProblemDetail) e POST /termos-aditivos retorna 201")
    void deveRetornar409Rfc9457NoPutEmAtaFinalizadaEPermitirTermoAditivo() throws Exception {
        AtaReuniao ata = novaAtaRascunho();
        ata.setStatus(StatusAta.FINALIZADA);
        ata.setFinalizadaEm(LocalDateTime.of(2026, 11, 22, 12, 0));
        when(ataReuniaoRepository.findById(ata.getId())).thenReturn(Optional.of(ata));

        String updatePayload = """
                {
                  "tipoReuniao": "PEDAGOGICA",
                  "dataReuniao": "2026-11-20T10:00:00",
                  "localReuniao": "Sala 2",
                  "pauta": "Tentativa de edição após finalização",
                  "deliberacoes": "Alteração indevida"
                }
                """;

        mockMvc.perform(put("/api/atas/{id}", ata.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/ata-finalizada"))
                .andExpect(jsonPath("$.title").value("Ata Finalizada – Imutável"))
                .andExpect(jsonPath("$.termoAditivoUri").value("/api/atas/" + ata.getId() + "/termos-aditivos"));

        String termoPayload = """
                {
                  "texto": "Termo aditivo explicativo: ajuste no prazo do compromisso #1 em comum acordo."
                }
                """;

        mockMvc.perform(post("/api/atas/{id}/termos-aditivos", ata.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(termoPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ataId").value(ata.getId().toString()))
                .andExpect(jsonPath("$.texto").value("Termo aditivo explicativo: ajuste no prazo do compromisso #1 em comum acordo."));
    }

    private AtaReuniao novaAtaRascunho() {
        AtaReuniao ata = new AtaReuniao(
                aluno,
                TipoReuniao.ALINHAMENTO_FAMILIA,
                LocalDateTime.of(2026, 11, 20, 10, 0),
                "Sala CLAI",
                "Pauta de alinhamento",
                "Deliberações"
        );
        ata.setId(UUID.randomUUID());
        ata.setCriadoPor(coordenador.getId());
        return ata;
    }
}
