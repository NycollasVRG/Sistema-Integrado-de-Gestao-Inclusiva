package com.br.CLAI.security;

import com.br.CLAI.controller.AnexoEstudanteController;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.service.AnexoEstudanteService;
import com.br.CLAI.service.CryptoStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnexoSecurityIntegrationTest {

    private static final String TEST_AES_KEY = "0123456789abcdef0123456789abcdef";
    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @TempDir
    Path tempVolumeDir;

    @Mock
    private AnexoEstudanteRepository anexoEstudanteRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private JwtService jwtService;
    private CryptoStorageService cryptoStorageService;
    private AnexoEstudanteService anexoEstudanteService;
    private MockMvc mockMvc;

    private final Map<UUID, AnexoEstudante> bancoAnexosSimulado = new HashMap<>();
    private final Map<String, Usuario> bancoUsuariosSimulado = new HashMap<>();

    private UUID estudanteId;
    private Aluno alunoTeste;

    private Usuario profissionalSaudeSuperRestrito;
    private Usuario adminTiSemAutorizacaoSaude;
    private Usuario coordenadorSemAutorizacaoSaude;
    private Usuario psicopedagogoRestricaoModerada;
    private Usuario professorSemAutorizacaoSaude;
    private Usuario alunoApoiador;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoAnexosSimulado.clear();
        bancoUsuariosSimulado.clear();

        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 28800000L);

        cryptoStorageService = new CryptoStorageService(TEST_AES_KEY, tempVolumeDir.toString());
        anexoEstudanteService = new AnexoEstudanteService(
                anexoEstudanteRepository,
                alunoRepository,
                cryptoStorageService
        );

        JwtAuthenticationFilter jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService, usuarioRepository);
        AnexoEstudanteController controller = new AnexoEstudanteController(anexoEstudanteService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtAuthenticationFilter)
                .build();

        estudanteId = UUID.fromString("99999999-8888-7777-6666-555555555555");
        alunoTeste = new Aluno("Mariana Costa", "20262055");
        alunoTeste.setId(estudanteId);

        lenient().when(alunoRepository.findById(estudanteId)).thenReturn(Optional.of(alunoTeste));
        lenient().when(anexoEstudanteRepository.save(any(AnexoEstudante.class))).thenAnswer(inv -> {
            AnexoEstudante entidade = inv.getArgument(0);
            if (entidade.getId() == null) {
                entidade.setId(UUID.randomUUID());
            }
            bancoAnexosSimulado.put(entidade.getId(), entidade);
            return entidade;
        });
        lenient().when(anexoEstudanteRepository.findById(any(UUID.class))).thenAnswer(inv -> {
            UUID id = inv.getArgument(0);
            return Optional.ofNullable(bancoAnexosSimulado.get(id));
        });

        // Configurar Matriz de Usuários da Task #50
        profissionalSaudeSuperRestrito = registrarUsuario(
                "Dra. Helena Saúde",
                "saude.autorizada@sigi.ifpb.edu.br",
                Role.ADMIN,
                NivelRestricao.SUPER_RESTRICAO,
                true
        );
        adminTiSemAutorizacaoSaude = registrarUsuario(
                "Admin TI Infraestrutura",
                "admin.ti@sigi.ifpb.edu.br",
                Role.ADMIN,
                NivelRestricao.SUPER_RESTRICAO,
                false
        );
        coordenadorSemAutorizacaoSaude = registrarUsuario(
                "Coordenador Geral CLAI",
                "coordenador@sigi.ifpb.edu.br",
                Role.COORDENADOR,
                NivelRestricao.SUPER_RESTRICAO,
                false
        );
        psicopedagogoRestricaoModerada = registrarUsuario(
                "Psicopedagogo Moderado",
                "psicopedagogo@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA,
                true
        );
        professorSemAutorizacaoSaude = registrarUsuario(
                "Professor Titular",
                "professor@sigi.ifpb.edu.br",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );
        alunoApoiador = registrarUsuario(
                "Aluno Apoiador",
                "aluno.apoiador@sigi.ifpb.edu.br",
                Role.ALUNO_APOIADOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );

        lenient().when(usuarioRepository.findByEmail(any(String.class))).thenAnswer(inv -> {
            String email = inv.getArgument(0);
            return Optional.ofNullable(bancoUsuariosSimulado.get(email));
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Usuario registrarUsuario(
            String nome,
            String email,
            Role role,
            NivelRestricao nivelRestricao,
            boolean autorizacaoSaude
    ) {
        Usuario u = new Usuario(nome, email, "hash", role, nivelRestricao, autorizacaoSaude);
        u.setId(UUID.randomUUID());
        u.setAcessoAtivo(true);
        u.setTokenVersion(1);
        bancoUsuariosSimulado.put(email, u);
        return u;
    }

    @Test
    @DisplayName("CA 1 [Ref. TA11.1] + CA 2 [Ref. TA11.2]: Deve manter laudo ilegível em disco e descriptografar exclusivamente em memória para usuário com SUPER_RESTRICAO + autorizacaoSaude = true")
    void deveDescriptografarEmMemoriaParaUsuarioComSuperRestricaoEAutorizacaoSaude() throws Exception {
        byte[] pdfLaudoOriginal = (
                "%PDF-1.7\n" +
                "%Laudo Neurológico Confidencial - Paciente Mariana Costa - CID G40 / F84.0\n" +
                "1 0 obj << /Type /Catalog >> endobj\n" +
                "%%EOF"
        ).getBytes(StandardCharsets.UTF_8);

        MockMultipartFile arquivoUpload = new MockMultipartFile(
                "arquivo",
                "laudo_neurologico_mariana.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfLaudoOriginal
        );

        AnexoEstudanteResponseDTO dtoCriado = anexoEstudanteService.uploadAnexo(
                estudanteId,
                arquivoUpload,
                TipoClassificacaoAnexo.LAUDO_MEDICO
        );

        AnexoEstudante entidadeNoBanco = bancoAnexosSimulado.get(dtoCriado.id());
        assertNotNull(entidadeNoBanco);
        assertTrue(entidadeNoBanco.isCriptografado());
        assertNotNull(entidadeNoBanco.getIv());

        // [CA 1 - TA11.1]: Verificar que o arquivo no volume de disco está cifrado e ilegível
        Path arquivoCifradoNoDisco = tempVolumeDir.resolve(entidadeNoBanco.getCaminhoArmazenamento());
        byte[] bytesNoDisco = Files.readAllBytes(arquivoCifradoNoDisco);
        String textoBrutoDisco = new String(bytesNoDisco, StandardCharsets.ISO_8859_1);
        assertFalse(textoBrutoDisco.startsWith("%PDF-"));
        assertFalse(textoBrutoDisco.contains("CID G40"));

        // [CA 2 - TA11.2]: Download autenticado com JWT de usuário SUPER_RESTRICAO + autorizacaoSaude = true
        String tokenSaudeAutorizada = jwtService.gerarToken(profissionalSaudeSuperRestrito);

        MvcResult downloadResult = mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", dtoCriado.id())
                        .header("Authorization", "Bearer " + tokenSaudeAutorizada))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("laudo_neurologico_mariana.pdf")))
                .andReturn();

        byte[] pdfBaixadoEmMemoria = downloadResult.getResponse().getContentAsByteArray();
        assertArrayEquals(pdfLaudoOriginal, pdfBaixadoEmMemoria, "O PDF baixado deve ser 100% idêntico ao original");
        assertTrue(new String(pdfBaixadoEmMemoria, StandardCharsets.UTF_8).startsWith("%PDF-1.7"));

        // Garantir que nenhum arquivo temporário descriptografado foi criado no diretório do volume
        try (Stream<Path> caminhosNoVolume = Files.walk(tempVolumeDir)) {
            List<Path> arquivosRegulares = caminhosNoVolume.filter(Files::isRegularFile).toList();
            assertEquals(1, arquivosRegulares.size(), "Deve existir apenas o arquivo .enc cifrado no volume, sem arquivos temporários abertos");
            assertTrue(arquivosRegulares.get(0).toString().endsWith(".enc"));
        }
    }

    @Test
    @DisplayName("CA 3 [Ref. TA11.2 e TA3.2]: Deve bloquear com HTTP 403 Forbidden Professor, Coordenador, Admin TI (autorizacaoSaude=false) e Psicopedagogo (RESTRICAO_MODERADA)")
    void deveBloquearCom403TodosOsPerfisSemSuperRestricaoEAutorizacaoSaudeSimultaneos() throws Exception {
        byte[] pdfDiagnostico = "%PDF-1.7 Diagnóstico Neuropsicológico Sigiloso".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile arquivoUpload = new MockMultipartFile(
                "arquivo",
                "diagnostico_neuropsicologico.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfDiagnostico
        );

        AnexoEstudanteResponseDTO anexoSensivel = anexoEstudanteService.uploadAnexo(
                estudanteId,
                arquivoUpload,
                TipoClassificacaoAnexo.DIAGNOSTICO_NEUROPSICOLOGICO
        );

        // 1. Professor (ACESSO_FUNCIONAL, autorizacaoSaude = false) -> 403 Forbidden
        String tokenProfessor = jwtService.gerarToken(professorSemAutorizacaoSaude);
        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoSensivel.id())
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));
        SecurityContextHolder.clearContext();

        // 2. Coordenador (SUPER_RESTRICAO, porém autorizacaoSaude = false) -> 403 Forbidden
        String tokenCoordenador = jwtService.gerarToken(coordenadorSemAutorizacaoSaude);
        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoSensivel.id())
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        SecurityContextHolder.clearContext();

        // 3. Admin de TI (Role ADMIN + SUPER_RESTRICAO, porém autorizacaoSaude = false) -> 403 Forbidden
        String tokenAdminTi = jwtService.gerarToken(adminTiSemAutorizacaoSaude);
        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoSensivel.id())
                        .header("Authorization", "Bearer " + tokenAdminTi))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        SecurityContextHolder.clearContext();

        // 4. Psicopedagogo (autorizacaoSaude = true, porém RESTRICAO_MODERADA != SUPER_RESTRICAO) -> 403 Forbidden
        String tokenPsicopedagogo = jwtService.gerarToken(psicopedagogoRestricaoModerada);
        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoSensivel.id())
                        .header("Authorization", "Bearer " + tokenPsicopedagogo))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        SecurityContextHolder.clearContext();

        // 5. Aluno Apoiador (ACESSO_FUNCIONAL, autorizacaoSaude = false) -> 403 Forbidden
        String tokenAlunoApoiador = jwtService.gerarToken(alunoApoiador);
        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoSensivel.id())
                        .header("Authorization", "Bearer " + tokenAlunoApoiador))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Fluxo Pedagógico: Professor e Coordenador autenticados podem baixar DOCUMENTO_PEDAGOGICO normalmente (200 OK)")
    void devePermitirDownloadDeDocumentoPedagogicoParaProfessorECoordenador() throws Exception {
        byte[] pdfPedagogico = "%PDF-1.4 Plano de Atividades Pedagógicas".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile arquivoUpload = new MockMultipartFile(
                "arquivo",
                "plano_pedagogico.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfPedagogico
        );

        AnexoEstudanteResponseDTO anexoPedagogico = anexoEstudanteService.uploadAnexo(
                estudanteId,
                arquivoUpload,
                TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO
        );

        String tokenProfessor = jwtService.gerarToken(professorSemAutorizacaoSaude);
        MvcResult result = mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", anexoPedagogico.id())
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isOk())
                .andReturn();

        assertArrayEquals(pdfPedagogico, result.getResponse().getContentAsByteArray());
    }

    @Test
    @DisplayName("Deve retornar 404 Not Found ao tentar baixar anexo inexistente")
    void deveRetornar404QuandoAnexoNaoExistir() throws Exception {
        String tokenSaude = jwtService.gerarToken(profissionalSaudeSuperRestrito);

        mockMvc.perform(get("/api/v1/anexos/{anexoId}/download", UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenSaude))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
