package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.dto.response.AdaptacaoDuaResponseDTO;
import com.br.CLAI.exception.IaIndisponivelException;
import com.br.CLAI.exception.IaTimeoutException;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.security.SecurityConfig;
import com.br.CLAI.service.AdaptacaoDuaService;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 07 - AdaptacaoDuaController: contrato HTTP, ProblemDetail RFC 9457 (TA7.2) e RBAC")
class AdaptacaoDuaControllerTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private AdaptacaoDuaService service;

    @Mock
    private UsuarioRepository usuarioRepository;

    private static AdaptacaoDuaService staticService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;

    private final Map<String, Usuario> bancoUsuarios = new HashMap<>();

    private Usuario professor;
    private Usuario coordenador;
    private Usuario psicopedagogo;
    private Usuario alunoApoiador;

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class SecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public AdaptacaoDuaController adaptacaoDuaController() {
            return new AdaptacaoDuaController(staticService);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuarios.clear();

        SecurityConfig securityConfig = new SecurityConfig(TEST_JWT_SECRET);
        jwtService = new JwtService(securityConfig.jwtEncoder(), 28800000L);
        staticRbacGuard = new RbacGuard();
        staticService = service;

        professor = registrarUsuario("Prof. Regente", "prof.us07@sigi.ifpb.edu.br",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL);
        coordenador = registrarUsuario("Coord. Curso", "coord.us07@sigi.ifpb.edu.br",
                Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO);
        psicopedagogo = registrarUsuario("Gestor CLAI", "clai.us07@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA);
        alunoApoiador = registrarUsuario("Aluno Apoiador", "apoiador.us07@sigi.ifpb.edu.br",
                Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL);

        lenient().when(usuarioRepository.findByEmail(any(String.class)))
                .thenAnswer(inv -> Optional.ofNullable(bancoUsuarios.get(inv.getArgument(0))));

        testContext = new AnnotationConfigApplicationContext(SecurityTestConfig.class);
        AdaptacaoDuaController proxiedController = testContext.getBean(AdaptacaoDuaController.class);

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

    private String corpo() {
        return "{\"alunoId\":\"" + UUID.randomUUID() + "\",\"textoProva\":\"Questão 1: calcule 2 + 2\"}";
    }

    @Test
    @DisplayName("Ref. TA7.2: timeout na IA retorna HTTP 504 com ProblemDetail amigável")
    void timeoutDeveRetornar504() throws Exception {
        when(service.adaptarProva(any())).thenThrow(new IaTimeoutException("A IA demorou mais que o esperado.", null));

        mockMvc.perform(post("/api/dua/adaptar")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo()))
                .andExpect(status().isGatewayTimeout())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(504))
                .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/ia-timeout"))
                .andExpect(jsonPath("$.detail").value("A IA demorou mais que o esperado."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("Ref. TA7.2: IA indisponível retorna HTTP 503 com ProblemDetail")
    void indisponivelDeveRetornar503() throws Exception {
        when(service.adaptarProva(any())).thenThrow(new IaIndisponivelException("IA indisponível.", null));

        mockMvc.perform(post("/api/dua/adaptar")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/ia-indisponivel"));
    }

    @Test
    @DisplayName("Ref. TA7.3 + RBAC: PROFESSOR, COORDENADOR e CLAI_PSICOPEDAGOGO obtêm preview com HTTP 200")
    void perfisAutorizadosDevemObterPreviewCom200() throws Exception {
        when(service.adaptarProva(any())).thenReturn(new AdaptacaoDuaResponseDTO(
                "original", "adaptado", List.of("TDAH"), List.of(), List.of(), true, "prompt", LocalDateTime.now()));

        for (Usuario autorizado : List.of(professor, coordenador, psicopedagogo)) {
            SecurityContextHolder.clearContext();
            mockMvc.perform(post("/api/dua/adaptar")
                            .header("Authorization", bearerToken(autorizado))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(corpo()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.textoAdaptado").value("adaptado"))
                    .andExpect(jsonPath("$.tagsDificuldadeAplicadas[0]").value("TDAH"))
                    .andExpect(jsonPath("$.complexidadePreservada").value(true));
        }
    }

    @Test
    @DisplayName("RBAC: ALUNO_APOIADOR deve receber HTTP 403 Forbidden (ProblemDetail RFC 9457) sem chamar o serviço")
    void alunoApoiadorDeveReceber403() throws Exception {
        mockMvc.perform(post("/api/dua/adaptar")
                        .header("Authorization", bearerToken(alunoApoiador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"))
                .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/acesso-negado"));

        verify(service, never()).adaptarProva(any());
    }

    @Test
    @DisplayName("RBAC: requisição sem autenticação deve ser bloqueada sem chamar o serviço")
    void semAutenticacaoDeveSerBloqueada() throws Exception {
        mockMvc.perform(post("/api/dua/adaptar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo()))
                .andExpect(status().isUnauthorized());

        verify(service, never()).adaptarProva(any());
    }

    @Test
    @DisplayName("Texto da prova em branco retorna HTTP 400")
    void textoEmBrancoDeveRetornar400() throws Exception {
        mockMvc.perform(post("/api/dua/adaptar")
                        .header("Authorization", bearerToken(professor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"alunoId\":\"" + UUID.randomUUID() + "\",\"textoProva\":\" \"}"))
                .andExpect(status().isBadRequest());
    }
}
