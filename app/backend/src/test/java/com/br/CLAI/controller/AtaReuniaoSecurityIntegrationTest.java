package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.security.SecurityConfig;
import com.br.CLAI.service.AtaReuniaoService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 08 - Segurança RBAC no AtaReuniaoController")
class AtaReuniaoSecurityIntegrationTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private AtaReuniaoService ataReuniaoService;

    @Mock
    private UsuarioRepository usuarioRepository;

    private static AtaReuniaoService staticService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;
    private final Map<String, Usuario> bancoUsuarios = new HashMap<>();

    private Usuario professor;
    private Usuario psicopedagogo;

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class SecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public AtaReuniaoController ataReuniaoController() {
            return new AtaReuniaoController(staticService, staticRbacGuard);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuarios.clear();

        SecurityConfig securityConfig = new SecurityConfig(TEST_JWT_SECRET);
        jwtService = new JwtService(securityConfig.jwtEncoder(), 28800000L);
        staticRbacGuard = new RbacGuard();
        staticService = ataReuniaoService;

        professor = registrar("Prof. Teste", "prof@sigi.ifpb.edu.br",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL);
        psicopedagogo = registrar("Psico CLAI", "psico@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA);

        lenient().when(usuarioRepository.findByEmail(any(String.class)))
                .thenAnswer(inv -> Optional.ofNullable(bancoUsuarios.get(inv.getArgument(0))));

        JwtAuthenticationProvider jwtAuthProvider = new JwtAuthenticationProvider(
                securityConfig.jwtDecoder(usuarioRepository));
        jwtAuthProvider.setJwtAuthenticationConverter(securityConfig.jwtAuthenticationConverter());

        BearerTokenAuthenticationFilter bearerFilter = new BearerTokenAuthenticationFilter(
                new ProviderManager(jwtAuthProvider));
        bearerFilter.setAuthenticationEntryPoint(securityConfig.authenticationEntryPoint());

        testContext = new AnnotationConfigApplicationContext(SecurityTestConfig.class);
        AtaReuniaoController controllerProxy = testContext.getBean(AtaReuniaoController.class);

        mockMvc = MockMvcBuilders.standaloneSetup(controllerProxy)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
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

    @Test
    @DisplayName("PROFESSOR recebe 403 ao criar ata, mas pode ler atas (200)")
    void professorDeveReceber403NaEscritaE200NaLeitura() throws Exception {
        String tokenProf = jwtService.gerarToken(professor);
        UUID alunoId = UUID.randomUUID();
        UUID ataId = UUID.randomUUID();

        String payload = String.format("""
                {
                  "alunoId": "%s",
                  "tipoReuniao": "PEDAGOGICA",
                  "dataReuniao": "2026-11-20T10:00:00",
                  "pauta": "Pauta de teste"
                }
                """, alunoId);

        mockMvc.perform(post("/api/atas")
                        .header("Authorization", "Bearer " + tokenProf)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        verify(ataReuniaoService, never()).criar(any(), any());

        when(ataReuniaoService.buscarPorId(ataId)).thenReturn(criarResponseExemplo(ataId, alunoId));

        mockMvc.perform(get("/api/atas/{id}", ataId)
                        .header("Authorization", "Bearer " + tokenProf))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("CLAI_PSICOPEDAGOGO consegue criar ata (201)")
    void psicopedagogoDeveCriarAtaComSucesso() throws Exception {
        String tokenPsico = jwtService.gerarToken(psicopedagogo);
        UUID alunoId = UUID.randomUUID();
        UUID ataId = UUID.randomUUID();

        when(ataReuniaoService.criar(any(), any())).thenReturn(criarResponseExemplo(ataId, alunoId));

        String payload = String.format("""
                {
                  "alunoId": "%s",
                  "tipoReuniao": "ALINHAMENTO_FAMILIA",
                  "dataReuniao": "2026-11-20T10:00:00",
                  "pauta": "Alinhamento com responsáveis"
                }
                """, alunoId);

        mockMvc.perform(post("/api/atas")
                        .header("Authorization", "Bearer " + tokenPsico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }

    private Usuario registrar(String nome, String email, Role role, NivelRestricao nivel) {
        Usuario u = new Usuario(nome, email, "hash", role, nivel, false);
        u.setId(UUID.randomUUID());
        bancoUsuarios.put(email, u);
        return u;
    }

    private AtaReuniaoResponseDTO criarResponseExemplo(UUID ataId, UUID alunoId) {
        return new AtaReuniaoResponseDTO(
                ataId, alunoId, "Estudante", TipoReuniao.PEDAGOGICA,
                LocalDateTime.of(2026, 11, 20, 10, 0), "Sala 1",
                "Pauta", "Deliberações", StatusAta.RASCUNHO,
                false, null, null, null, null, null,
                List.of(), List.of(), List.of(),
                psicopedagogo.getId(), LocalDateTime.now(), LocalDateTime.now()
        );
    }
}
