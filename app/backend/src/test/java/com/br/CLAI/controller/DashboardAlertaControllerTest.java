package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.domain.enums.TipoAlertaPedagogico;
import com.br.CLAI.dto.response.AlertaPedagogicoResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.security.SecurityConfig;
import com.br.CLAI.service.AlertaPedagogicoService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 05 - DashboardAlertaController: Contrato HTTP, Filtros (TA5.3), Tratamento (TA5.4) e RBAC")
class DashboardAlertaControllerTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private AlertaPedagogicoService alertaService;

    @Mock
    private UsuarioRepository usuarioRepository;

    private static AlertaPedagogicoService staticAlertaService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;

    private final Map<String, Usuario> bancoUsuarios = new HashMap<>();

    private Usuario professor;
    private Usuario coordenador;
    private Usuario psicopedagogo;
    private UUID alertaId;
    private UUID alunoId;

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class SecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public DashboardAlertaController dashboardAlertaController() {
            return new DashboardAlertaController(staticAlertaService, staticRbacGuard);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuarios.clear();

        SecurityConfig securityConfig = new SecurityConfig(TEST_JWT_SECRET);
        jwtService = new JwtService(securityConfig.jwtEncoder(), 28800000L);
        staticRbacGuard = new RbacGuard();
        staticAlertaService = alertaService;

        professor = registrarUsuario("Prof. Regente", "prof.us05@sigi.ifpb.edu.br",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL);
        coordenador = registrarUsuario("Coord. Curso", "coord.us05@sigi.ifpb.edu.br",
                Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO);
        psicopedagogo = registrarUsuario("Gestor CLAI", "clai.us05@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA);

        lenient().when(usuarioRepository.findByEmail(any(String.class)))
                .thenAnswer(inv -> Optional.ofNullable(bancoUsuarios.get(inv.getArgument(0))));

        alertaId = UUID.randomUUID();
        alunoId = UUID.randomUUID();

        testContext = new AnnotationConfigApplicationContext(SecurityTestConfig.class);
        DashboardAlertaController proxiedController = testContext.getBean(DashboardAlertaController.class);

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
    @DisplayName("Ref. TA5.3: COORDENADOR deve filtrar alertas por unidade, curso e turma no Dashboard")
    void coordenadorDeveFiltrarAlertasPorUnidadeCursoETurma() throws Exception {
        AlertaPedagogicoResponseDTO alerta = new AlertaPedagogicoResponseDTO(
                alertaId,
                alunoId,
                "Maria Clara",
                "20261001",
                TipoAlertaPedagogico.RETENCAO,
                SeveridadeAlerta.VERMELHO,
                "Campus João Pessoa",
                "Sistemas para Internet",
                "P4",
                "Retenção detectada no SUAP",
                false,
                null,
                null,
                LocalDateTime.now()
        );

        when(alertaService.listarAlertas("Campus João Pessoa", "Sistemas para Internet", "P4", false, null, null))
                .thenReturn(List.of(alerta));

        mockMvc.perform(get("/api/dashboard/alertas")
                        .param("unidade", "Campus João Pessoa")
                        .param("curso", "Sistemas para Internet")
                        .param("turma", "P4")
                        .header("Authorization", bearerToken(coordenador)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(alertaId.toString()))
                .andExpect(jsonPath("$[0].severidade").value("VERMELHO"))
                .andExpect(jsonPath("$[0].unidade").value("Campus João Pessoa"))
                .andExpect(jsonPath("$[0].curso").value("Sistemas para Internet"))
                .andExpect(jsonPath("$[0].turma").value("P4"))
                .andExpect(jsonPath("$[0].tratado").value(false));

        verify(alertaService).listarAlertas("Campus João Pessoa", "Sistemas para Internet", "P4", false, null, null);
    }

    @Test
    @DisplayName("Ref. TA5.4: PATCH /api/dashboard/alertas/{id}/tratar deve registrar autor autenticado e retornar tratado=true")
    void gestorClaiDeveMarcarAlertaComoTratado() throws Exception {
        LocalDateTime tratadoEm = LocalDateTime.of(2026, 11, 20, 15, 30);
        AlertaPedagogicoResponseDTO resposta = new AlertaPedagogicoResponseDTO(
                alertaId,
                alunoId,
                "Maria Clara",
                "20261001",
                TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA,
                SeveridadeAlerta.PEDAGOGICO,
                "Campus João Pessoa",
                "Sistemas para Internet",
                "P4",
                "Incoerência avaliativa detectada",
                true,
                psicopedagogo.getId(),
                tratadoEm,
                LocalDateTime.of(2026, 11, 20, 10, 0)
        );

        when(alertaService.marcarComoTratado(eq(alertaId), eq(psicopedagogo.getId()))).thenReturn(resposta);

        mockMvc.perform(patch("/api/dashboard/alertas/{id}/tratar", alertaId)
                        .header("Authorization", bearerToken(psicopedagogo))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alertaId.toString()))
                .andExpect(jsonPath("$.tratado").value(true))
                .andExpect(jsonPath("$.tratadoPor").value(psicopedagogo.getId().toString()))
                .andExpect(jsonPath("$.tratadoEm").isNotEmpty());

        verify(alertaService).marcarComoTratado(alertaId, psicopedagogo.getId());
    }

    @Test
    @DisplayName("RBAC: PROFESSOR (ACESSO_FUNCIONAL) deve receber HTTP 403 Forbidden no Dashboard de alertas")
    void professorDeveReceber403NoDashboardDeAlertas() throws Exception {
        mockMvc.perform(get("/api/dashboard/alertas")
                        .header("Authorization", bearerToken(professor)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));

        mockMvc.perform(patch("/api/dashboard/alertas/{id}/tratar", alertaId)
                        .header("Authorization", bearerToken(professor)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verify(alertaService, never()).listarAlertas(any(), any(), any(), any(), any(), any());
        verify(alertaService, never()).marcarComoTratado(any(), any());
    }
}
