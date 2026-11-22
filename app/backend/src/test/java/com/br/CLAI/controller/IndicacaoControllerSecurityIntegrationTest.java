package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusIndicacao;
import com.br.CLAI.dto.request.AprovacaoIndicacaoRequestDTO;
import com.br.CLAI.dto.request.IndicacaoRequestDTO;
import com.br.CLAI.dto.request.RejeicaoIndicacaoRequestDTO;
import com.br.CLAI.dto.response.IndicacaoResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.security.SecurityConfig;
import com.br.CLAI.service.IndicacaoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 10 - Contrato HTTP, Validação Bean Validation (TA10.1) e Method Security RBAC (TA10.3)")
class IndicacaoControllerSecurityIntegrationTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private IndicacaoService indicacaoService;

    @Mock
    private UsuarioRepository usuarioRepository;

    private static IndicacaoService staticIndicacaoService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;

    private final Map<String, Usuario> bancoUsuarios = new HashMap<>();

    private Usuario professor;
    private Usuario alunoApoiador;
    private Usuario psicopedagogo;
    private Usuario coordenador;

    private UUID alunoId;
    private UUID indicacaoId;
    private UUID estudoDeCasoId;

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class SecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public IndicacaoController indicacaoController() {
            return new IndicacaoController(staticIndicacaoService, staticRbacGuard);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuarios.clear();

        SecurityConfig securityConfig = new SecurityConfig(TEST_JWT_SECRET);
        jwtService = new JwtService(securityConfig.jwtEncoder(), 28800000L);
        staticRbacGuard = new RbacGuard();
        staticIndicacaoService = indicacaoService;

        professor = registrarUsuario("Professor João", "prof@sigi.ifpb.edu.br",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL);
        alunoApoiador = registrarUsuario("Apoiador Ana", "apoiador@sigi.ifpb.edu.br",
                Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL);
        psicopedagogo = registrarUsuario("Psicopedagoga Maria", "psico@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA);
        coordenador = registrarUsuario("Coordenador Pedro", "coord@sigi.ifpb.edu.br",
                Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO);

        lenient().when(usuarioRepository.findByEmail(any(String.class)))
                .thenAnswer(inv -> Optional.ofNullable(bancoUsuarios.get(inv.getArgument(0))));

        alunoId = UUID.randomUUID();
        indicacaoId = UUID.randomUUID();
        estudoDeCasoId = UUID.randomUUID();

        testContext = new AnnotationConfigApplicationContext(SecurityTestConfig.class);
        IndicacaoController proxiedController = testContext.getBean(IndicacaoController.class);

        JwtAuthenticationProvider jwtAuthProvider =
                new JwtAuthenticationProvider(securityConfig.jwtDecoder(usuarioRepository));
        jwtAuthProvider.setJwtAuthenticationConverter(securityConfig.jwtAuthenticationConverter());
        BearerTokenAuthenticationFilter bearerFilter =
                new BearerTokenAuthenticationFilter(new ProviderManager(jwtAuthProvider));
        bearerFilter.setAuthenticationEntryPoint(securityConfig.authenticationEntryPoint());

        mockMvc = MockMvcBuilders.standaloneSetup(proxiedController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(bearerFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (testContext != null) {
            testContext.close();
        }
    }

    private Usuario registrarUsuario(String nome, String email, Role role, NivelRestricao nivel) {
        Usuario u = new Usuario(nome, email, "hash", role, nivel, false);
        u.setId(UUID.randomUUID());
        u.setAcessoAtivo(true);
        u.setTokenVersion(1);
        bancoUsuarios.put(email, u);
        return u;
    }

    private String bearerToken(Usuario usuario) {
        return "Bearer " + jwtService.gerarToken(usuario);
    }

    @Test
    @DisplayName("TA10.1: POST /api/indicacoes sem justificativa pedagógica deve retornar HTTP 400 Bad Request")
    void criarSemJustificativaDeveRetornar400() throws Exception {
        String payload = """
                {
                  "alunoId": "%s",
                  "justificativaPedagogica": "   ",
                  "disciplinasObservadas": ["Matemática"]
                }
                """.formatted(alunoId);

        mockMvc.perform(post("/api/indicacoes")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Validação de Campos"));

        verify(indicacaoService, never()).criar(any(), any());
    }

    @Test
    @DisplayName("TA10.1: POST /api/indicacoes sem disciplinas observadas deve retornar HTTP 400 Bad Request")
    void criarSemDisciplinasDeveRetornar400() throws Exception {
        String payload = """
                {
                  "alunoId": "%s",
                  "justificativaPedagogica": "Dificuldades de interpretação e acompanhamento em sala.",
                  "disciplinasObservadas": []
                }
                """.formatted(alunoId);

        mockMvc.perform(post("/api/indicacoes")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Validação de Campos"));

        verify(indicacaoService, never()).criar(any(), any());
    }

    @Test
    @DisplayName("TA10.2: POST /api/indicacoes válido por PROFESSOR deve retornar HTTP 201 Created com aluno EM_TRIAGEM")
    void criarValidoPorProfessorDeveRetornar201() throws Exception {
        IndicacaoResponseDTO response = new IndicacaoResponseDTO(
                indicacaoId, alunoId, "Maria Souza", "20261020", StatusAluno.EM_TRIAGEM,
                professor.getId(), professor.getNome(),
                "Dificuldade persistente em cálculo e interpretação textual.",
                List.of("Matemática", "Português"),
                StatusIndicacao.PENDENTE, null, null, null, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(indicacaoService.criar(any(IndicacaoRequestDTO.class), eq(professor.getId())))
                .thenReturn(response);

        String payload = """
                {
                  "alunoId": "%s",
                  "justificativa": "Dificuldade persistente em cálculo e interpretação textual.",
                  "disciplinas": ["Matemática", "Português"]
                }
                """.formatted(alunoId);

        mockMvc.perform(post("/api/indicacoes")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(indicacaoId.toString()))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.statusAluno").value("EM_TRIAGEM"));

        verify(indicacaoService).criar(any(IndicacaoRequestDTO.class), eq(professor.getId()));
    }

    @Test
    @DisplayName("ALUNO_APOIADOR não deve conseguir criar indicação (HTTP 403 Forbidden)")
    void alunoApoiadorNaoPodeCriarIndicacao() throws Exception {
        String payload = """
                {
                  "alunoId": "%s",
                  "justificativaPedagogica": "Justificativa teste.",
                  "disciplinasObservadas": ["Física"]
                }
                """.formatted(alunoId);

        mockMvc.perform(post("/api/indicacoes")
                        .header("Authorization", bearerToken(alunoApoiador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verify(indicacaoService, never()).criar(any(), any());
    }

    @Test
    @DisplayName("TA10.3: PROFESSOR deve ser bloqueado ao tentar aprovar ou rejeitar indicação (HTTP 403 Forbidden)")
    void professorDeveSerBloqueadoEmAprovarERejeitarCom403() throws Exception {
        mockMvc.perform(patch("/api/indicacoes/{id}/aprovar", indicacaoId)
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));

        mockMvc.perform(patch("/api/indicacoes/{id}/rejeitar", indicacaoId)
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"justificativaDecisao\":\"Tentativa indevida\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));

        verify(indicacaoService, never()).aprovar(any(), any(), any());
        verify(indicacaoService, never()).rejeitar(any(), any(), any());
    }

    @Test
    @DisplayName("TA10.3: CLAI_PSICOPEDAGOGO rejeitando sem justificativa deve receber HTTP 400 Bad Request")
    void claiRejeitandoSemJustificativaDeveReceber400() throws Exception {
        mockMvc.perform(patch("/api/indicacoes/{id}/rejeitar", indicacaoId)
                        .header("Authorization", bearerToken(psicopedagogo))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"justificativaDecisao\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Validação de Campos"));

        verify(indicacaoService, never()).rejeitar(any(), any(), any());
    }

    @Test
    @DisplayName("TA10.3: CLAI_PSICOPEDAGOGO deve conseguir aprovar indicação (HTTP 200 OK com estudoDeCasoId)")
    void claiDeveConseguirAprovarIndicacao200() throws Exception {
        IndicacaoResponseDTO aprovada = new IndicacaoResponseDTO(
                indicacaoId, alunoId, "Maria Souza", "20261020", StatusAluno.ATIVO,
                professor.getId(), professor.getNome(),
                "Justificativa", List.of("Matemática"),
                StatusIndicacao.APROVADA, "Encaminhado ao Estudo de Caso",
                psicopedagogo.getId(), LocalDateTime.now(), estudoDeCasoId,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(indicacaoService.aprovar(eq(indicacaoId), any(AprovacaoIndicacaoRequestDTO.class), eq(psicopedagogo.getId())))
                .thenReturn(aprovada);

        mockMvc.perform(patch("/api/indicacoes/{id}/aprovar", indicacaoId)
                        .header("Authorization", bearerToken(psicopedagogo))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"justificativaDecisao\":\"Encaminhado ao Estudo de Caso\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADA"))
                .andExpect(jsonPath("$.statusAluno").value("ATIVO"))
                .andExpect(jsonPath("$.estudoDeCasoId").value(estudoDeCasoId.toString()));
    }

    @Test
    @DisplayName("TA10.3: COORDENADOR deve conseguir rejeitar indicação com justificativa documentada (HTTP 200 OK)")
    void coordenadorDeveConseguirRejeitarIndicacao200() throws Exception {
        IndicacaoResponseDTO rejeitada = new IndicacaoResponseDTO(
                indicacaoId, alunoId, "Maria Souza", "20261020", StatusAluno.ATIVO,
                professor.getId(), professor.getNome(),
                "Justificativa", List.of("Matemática"),
                StatusIndicacao.REJEITADA, "Demanda atendida via reforço regular de disciplina.",
                coordenador.getId(), LocalDateTime.now(), null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(indicacaoService.rejeitar(eq(indicacaoId), any(RejeicaoIndicacaoRequestDTO.class), eq(coordenador.getId())))
                .thenReturn(rejeitada);

        mockMvc.perform(patch("/api/indicacoes/{id}/rejeitar", indicacaoId)
                        .header("Authorization", bearerToken(coordenador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"justificativaDecisao\":\"Demanda atendida via reforço regular de disciplina.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJEITADA"))
                .andExpect(jsonPath("$.justificativaDecisao").value("Demanda atendida via reforço regular de disciplina."));
    }
}
