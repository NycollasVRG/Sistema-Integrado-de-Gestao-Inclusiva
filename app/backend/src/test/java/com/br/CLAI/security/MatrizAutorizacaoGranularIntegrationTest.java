package com.br.CLAI.security;

import com.br.CLAI.controller.EstudoDeCasoController;
import com.br.CLAI.controller.PeiController;
import com.br.CLAI.controller.ProntuarioController;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.response.HistoricoSocioemocionalResponseDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.repository.*;
import com.br.CLAI.service.EstudoDeCasoService;
import com.br.CLAI.service.PeiService;
import com.br.CLAI.service.ProntuarioService;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
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
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suíte de Testes Automatizados para a Matriz de Autorização Granular (Task #52).
 * Validação rigorosa dos Critérios de Aceite:
 * - CA 1 [Ref. TA11.3]: Professor com omissão no Prontuário e Estudo de Caso.
 * - CA 1.2 [Ref. TA11.3]: Professor bloqueado na rota exclusiva de histórico socioemocional (403 Forbidden).
 * - CA 2 [Ref. TA11.3]: Equipe CLAI com acesso integral e descriptografado aos dados socioemocionais.
 * - Reforço TA3.2: Professor bloqueado nos anexos sensíveis do PEI via Method Security.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Task #52 - Suíte Completa da Matriz de Autorização Granular (TA11.3 / TA3.2)")
class MatrizAutorizacaoGranularIntegrationTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Mock
    private IndicadorReutilizavelRepository indicadorRepository;

    @Mock
    private PeiRepository peiRepository;

    @Mock
    private PeaRepository peaRepository;

    @Mock
    private AnexoEstudanteRepository anexoEstudanteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PeiService peiService;

    private static ProntuarioService staticProntuarioService;
    private static EstudoDeCasoService staticEstudoDeCasoService;
    private static PeiService staticPeiService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private RbacGuard rbacGuard;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;

    private UUID alunoId;
    private UUID estudoId;
    private UUID peiId;
    private Aluno alunoTeste;
    private EstudoDeCaso estudoTeste;

    private Usuario professorUser;
    private Usuario alunoApoiadorUser;
    private Usuario psicopedagogoUser;
    private Usuario coordenadorUser;
    private Usuario adminUser;

    private final Map<String, Usuario> bancoUsuariosSimulado = new HashMap<>();

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class MethodSecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public ProntuarioController prontuarioController() {
            return new ProntuarioController(staticProntuarioService);
        }

        @Bean
        public EstudoDeCasoController estudoDeCasoController() {
            return new EstudoDeCasoController(staticEstudoDeCasoService);
        }

        @Bean
        public PeiController peiController() {
            return new PeiController(staticPeiService);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuariosSimulado.clear();

        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 28800000L);

        rbacGuard = new RbacGuard();
        staticRbacGuard = rbacGuard;

        EstudoDeCasoMapper mapper = new EstudoDeCasoMapper(rbacGuard);
        EstudoDeCasoValidator validator = new EstudoDeCasoValidator();

        EstudoDeCasoService estudoDeCasoService = new EstudoDeCasoService(
                estudoDeCasoRepository,
                alunoRepository,
                indicadorRepository,
                validator,
                mapper
        );
        staticEstudoDeCasoService = estudoDeCasoService;

        ProntuarioService prontuarioService = new ProntuarioService(
                alunoRepository,
                estudoDeCasoRepository,
                peiRepository,
                peaRepository,
                anexoEstudanteRepository,
                rbacGuard
        );
        staticProntuarioService = prontuarioService;
        staticPeiService = peiService;

        alunoId = UUID.fromString("11111111-2222-3333-4444-555555555555");
        estudoId = UUID.fromString("66666666-7777-8888-9999-000000000000");
        peiId = UUID.fromString("77777777-8888-9999-aaaa-bbbbbbbbbbbb");

        alunoTeste = new Aluno("Mariana Costa", "20261001");
        alunoTeste.setId(alunoId);

        estudoTeste = new EstudoDeCaso(alunoTeste, StatusEstudoCaso.ATIVO, "Dificuldades de atenção e interpretação textual");
        estudoTeste.setId(estudoId);
        estudoTeste.setHistoricoFamiliar("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio.");
        estudoTeste.setHistoricoSocioemocional("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo.");
        estudoTeste.setCriadoEm(LocalDateTime.now());
        estudoTeste.setAtualizadoEm(LocalDateTime.now());

        lenient().when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(alunoTeste));
        lenient().when(alunoRepository.existsById(alunoId)).thenReturn(true);
        lenient().when(estudoDeCasoRepository.findById(estudoId)).thenReturn(Optional.of(estudoTeste));
        lenient().when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudoTeste));
        lenient().when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(Collections.emptyList());
        lenient().when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(Collections.emptyList());
        lenient().when(anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId)).thenReturn(Collections.emptyList());

        PeaResponseDTO peaDTO = new PeaResponseDTO(
                UUID.randomUUID(),
                UUID.randomUUID(),
                alunoId,
                UUID.randomUUID(),
                "Objetivo Adaptado",
                "Metodologia Visual",
                "Avaliação Contínua",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        lenient().when(peiService.listarAnexosSensiveis(any(UUID.class), any())).thenReturn(List.of(peaDTO));
        lenient().when(peiService.listarAnexosSensiveis(any(UUID.class))).thenReturn(List.of(peaDTO));

        professorUser = registrarUsuario("Professor", "professor@sigi.ifpb.edu.br", Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        alunoApoiadorUser = registrarUsuario("Apoiador", "apoiador@sigi.ifpb.edu.br", Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        psicopedagogoUser = registrarUsuario("Psicopedagoga", "psicopedagoga@sigi.ifpb.edu.br", Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true);
        coordenadorUser = registrarUsuario("Coordenador", "coordenador@sigi.ifpb.edu.br", Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO, false);
        adminUser = registrarUsuario("Admin", "admin@sigi.ifpb.edu.br", Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true);

        lenient().when(usuarioRepository.findByEmail(any(String.class))).thenAnswer(inv -> {
            String email = inv.getArgument(0);
            return Optional.ofNullable(bancoUsuariosSimulado.get(email));
        });

        // Inicializar contexto Spring com Method Security ativo (@PreAuthorize habilitado)
        testContext = new AnnotationConfigApplicationContext(MethodSecurityTestConfig.class);
        ProntuarioController proxiedProntuario = testContext.getBean(ProntuarioController.class);
        EstudoDeCasoController proxiedEstudo = testContext.getBean(EstudoDeCasoController.class);
        PeiController proxiedPei = testContext.getBean(PeiController.class);

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, usuarioRepository);

        mockMvc = MockMvcBuilders.standaloneSetup(proxiedProntuario, proxiedEstudo, proxiedPei)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (testContext != null) {
            testContext.close();
        }
    }

    private Usuario registrarUsuario(String nome, String email, Role role, NivelRestricao nivel, boolean saude) {
        Usuario u = new Usuario(nome, email, "hash", role, nivel, saude);
        u.setId(UUID.randomUUID());
        u.setAcessoAtivo(true);
        u.setTokenVersion(1);
        bancoUsuariosSimulado.put(email, u);
        return u;
    }

    @Test
    @DisplayName("CA 1 [TA11.3]: Professor - Omissão no JSON de Estudo de Caso e Prontuário Unificado")
    void professorDeveReceberDadosPedagogicosMasComHistoricoSensivelOmitido() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);

        // 1. Estudo de Caso: 200 OK, porém sem as chaves sensíveis
        mockMvc.perform(get("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagnosticoInicial").value("Dificuldades de atenção e interpretação textual"))
                .andExpect(jsonPath("$.historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.historicoSocioemocional").doesNotExist());

        SecurityContextHolder.clearContext();

        // 2. Prontuário Unificado: 200 OK, porém sem as chaves sensíveis
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/prontuario", alunoId)
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeAluno").value("Mariana Costa"))
                .andExpect(jsonPath("$.historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.historicoSocioemocional").doesNotExist());
    }

    @Test
    @DisplayName("CA 1.2 [TA11.3]: Professor e Aluno Apoiador - Bloqueio na Rota Exclusiva com HTTP 403 Forbidden RFC 9457")
    void perfisComAcessoFuncionalDevemSerBloqueadosCom403NaRotaDireta() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);
        String tokenApoiador = jwtService.gerarToken(alunoApoiadorUser);

        // 1. Tentativa de acesso direto pelo Professor -> 403 Forbidden
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/historico-socioemocional", alunoId)
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"))
                .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/acesso-negado"))
                .andExpect(jsonPath("$.detail").value("Seu perfil não possui permissão para acessar este recurso."));

        SecurityContextHolder.clearContext();

        // 2. Tentativa de acesso direto pelo Aluno Apoiador -> 403 Forbidden
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/historico-socioemocional", alunoId)
                        .header("Authorization", "Bearer " + tokenApoiador))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));
    }

    @Test
    @DisplayName("CA 2 [TA11.3]: Psicopedagoga CLAI (RESTRICAO_MODERADA) - Acesso Integral em todas as rotas (200 OK)")
    void psicopedagogaDeveAcessarIntegralmenteHistoricoFamiliarESocioemocional() throws Exception {
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogoUser);

        // 1. Estudo de Caso: 200 OK com dados completos
        mockMvc.perform(get("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").value("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio."))
                .andExpect(jsonPath("$.historicoSocioemocional").value("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo."));

        SecurityContextHolder.clearContext();

        // 2. Prontuário Unificado: 200 OK com dados completos
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/prontuario", alunoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").value("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio."))
                .andExpect(jsonPath("$.historicoSocioemocional").value("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo."));

        SecurityContextHolder.clearContext();

        // 3. Rota Exclusiva de Detalhes Socioemocionais: 200 OK com dados completos
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/historico-socioemocional", alunoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alunoId").value(alunoId.toString()))
                .andExpect(jsonPath("$.nomeAluno").value("Mariana Costa"))
                .andExpect(jsonPath("$.historicoFamiliar").value("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio."))
                .andExpect(jsonPath("$.historicoSocioemocional").value("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo."));
    }

    @Test
    @DisplayName("CA 2.2 [TA11.3]: Coordenador e Admin (SUPER_RESTRICAO) - Acesso liberado na rota exclusiva (200 OK)")
    void superRestricaoDeveTerAcessoLiberadoNaRotaExclusiva() throws Exception {
        String tokenCoordenador = jwtService.gerarToken(coordenadorUser);
        String tokenAdmin = jwtService.gerarToken(adminUser);

        // 1. Coordenador
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/historico-socioemocional", alunoId)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").exists())
                .andExpect(jsonPath("$.historicoSocioemocional").exists());

        SecurityContextHolder.clearContext();

        // 2. Admin
        mockMvc.perform(get("/api/v1/estudantes/{estudanteId}/historico-socioemocional", alunoId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").exists())
                .andExpect(jsonPath("$.historicoSocioemocional").exists());
    }

    @Test
    @DisplayName("Reforço TA3.2: Anexos Sensíveis do PEI bloqueiam Professor (403) e liberam CLAI/Coordenação (200 OK)")
    void deveProtegerAnexosSensiveisDoPeiComMethodSecurity() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogoUser);

        // 1. Professor tentando acessar anexos sensíveis do PEI -> 403 Forbidden via @PreAuthorize
        mockMvc.perform(get("/api/peis/{id}/anexos-sensiveis", peiId)
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));

        SecurityContextHolder.clearContext();

        // 2. Psicopedagoga acessando anexos sensíveis do PEI -> 200 OK
        mockMvc.perform(get("/api/peis/{id}/anexos-sensiveis", peiId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga))
                .andExpect(status().isOk());
    }
}
