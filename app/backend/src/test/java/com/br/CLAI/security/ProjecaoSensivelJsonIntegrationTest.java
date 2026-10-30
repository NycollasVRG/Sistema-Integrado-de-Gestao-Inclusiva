package com.br.CLAI.security;

import com.br.CLAI.controller.EstudoDeCasoController;
import com.br.CLAI.controller.ProntuarioController;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.repository.*;
import com.br.CLAI.service.EstudoDeCasoService;
import com.br.CLAI.service.ProntuarioService;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("Task #52 - Etapa 2: Projeção e Omissão Condicional no JSON (TA11.3)")
class ProjecaoSensivelJsonIntegrationTest {

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

    private JwtService jwtService;
    private RbacGuard rbacGuard;
    private MockMvc mockMvc;

    private UUID alunoId;
    private UUID estudoId;
    private Aluno alunoTeste;
    private EstudoDeCaso estudoTeste;

    private Usuario professorUser;
    private Usuario psicopedagogoUser;
    private Usuario coordenadorUser;
    private Usuario adminUser;

    private final Map<String, Usuario> bancoUsuariosSimulado = new HashMap<>();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuariosSimulado.clear();

        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 28800000L);

        rbacGuard = new RbacGuard();

        EstudoDeCasoMapper mapper = new EstudoDeCasoMapper(rbacGuard);
        EstudoDeCasoValidator validator = new EstudoDeCasoValidator();

        EstudoDeCasoService estudoDeCasoService = new EstudoDeCasoService(
                estudoDeCasoRepository,
                alunoRepository,
                indicadorRepository,
                validator,
                mapper
        );

        ProntuarioService prontuarioService = new ProntuarioService(
                alunoRepository,
                estudoDeCasoRepository,
                peiRepository,
                peaRepository,
                anexoEstudanteRepository,
                rbacGuard
        );

        EstudoDeCasoController estudoController = new EstudoDeCasoController(estudoDeCasoService);
        ProntuarioController prontuarioController = new ProntuarioController(prontuarioService);

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, usuarioRepository);

        mockMvc = MockMvcBuilders.standaloneSetup(estudoController, prontuarioController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();

        alunoId = UUID.fromString("11111111-2222-3333-4444-555555555555");
        estudoId = UUID.fromString("66666666-7777-8888-9999-000000000000");

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

        professorUser = registrarUsuario(
                "Professor Titular",
                "professor@sigi.ifpb.edu.br",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );

        psicopedagogoUser = registrarUsuario(
                "Psicopedagoga CLAI",
                "psicopedagoga@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA,
                true
        );

        coordenadorUser = registrarUsuario(
                "Coordenador Geral",
                "coordenador@sigi.ifpb.edu.br",
                Role.COORDENADOR,
                NivelRestricao.SUPER_RESTRICAO,
                false
        );

        adminUser = registrarUsuario(
                "Admin Institucional",
                "admin@sigi.ifpb.edu.br",
                Role.ADMIN,
                NivelRestricao.SUPER_RESTRICAO,
                true
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
    @DisplayName("CA 1 [TA11.3]: PROFESSOR (ACESSO_FUNCIONAL) - Omissão completa de historicoFamiliar e historicoSocioemocional no Estudo de Caso")
    void professorDeveReceberEstudoDeCasoComCamposSensiveisOmitidosNoJson() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);

        mockMvc.perform(get("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenProfessor)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(estudoId.toString()))
                .andExpect(jsonPath("$.alunoId").value(alunoId.toString()))
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andExpect(jsonPath("$.diagnosticoInicial").value("Dificuldades de atenção e interpretação textual"))
                // TA11.3: Omissão estrita - propriedades NÃO devem existir na serialização JSON (@JsonInclude(NON_NULL))
                .andExpect(jsonPath("$.historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.historicoSocioemocional").doesNotExist());
    }

    @Test
    @DisplayName("CA 1 [TA11.3]: PROFESSOR (ACESSO_FUNCIONAL) - Omissão completa de historicoFamiliar e historicoSocioemocional no Prontuário Unificado")
    void professorDeveReceberProntuarioComCamposSensiveisOmitidosNoJson() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);

        mockMvc.perform(get("/api/v1/alunos/{estudanteId}/prontuario", alunoId)
                        .header("Authorization", "Bearer " + tokenProfessor)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alunoId").value(alunoId.toString()))
                .andExpect(jsonPath("$.nomeAluno").value("Mariana Costa"))
                .andExpect(jsonPath("$.matricula").value("20261001"))
                .andExpect(jsonPath("$.diagnosticoInicial").value("Dificuldades de atenção e interpretação textual"))
                // TA11.3: Omissão no Prontuário Unificado
                .andExpect(jsonPath("$.historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.historicoSocioemocional").doesNotExist());
    }

    @Test
    @DisplayName("CA 2 [TA11.3]: CLAI_PSICOPEDAGOGO (RESTRICAO_MODERADA) - Acesso integral aos campos sensíveis no Estudo de Caso")
    void psicopedagogaDeveReceberEstudoDeCasoComCamposSensiveisPreenchidos() throws Exception {
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogoUser);

        mockMvc.perform(get("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(estudoId.toString()))
                .andExpect(jsonPath("$.diagnosticoInicial").value("Dificuldades de atenção e interpretação textual"))
                // TA11.3: Equipe CLAI tem acesso liberado aos dados de dinâmica familiar e socioemocional
                .andExpect(jsonPath("$.historicoFamiliar").value("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio."))
                .andExpect(jsonPath("$.historicoSocioemocional").value("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo."));
    }

    @Test
    @DisplayName("CA 2 [TA11.3]: CLAI_PSICOPEDAGOGO (RESTRICAO_MODERADA) - Acesso integral aos campos sensíveis no Prontuário Unificado")
    void psicopedagogaDeveReceberProntuarioComCamposSensiveisPreenchidos() throws Exception {
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogoUser);

        mockMvc.perform(get("/api/v1/alunos/{estudanteId}/prontuario", alunoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alunoId").value(alunoId.toString()))
                .andExpect(jsonPath("$.nomeAluno").value("Mariana Costa"))
                .andExpect(jsonPath("$.historicoFamiliar").value("Família monoparental com suporte dos avós maternos; histórico de TDAH no tio."))
                .andExpect(jsonPath("$.historicoSocioemocional").value("Apresenta ansiedade em avaliações presenciais e retração em trabalhos em grupo."));
    }

    @Test
    @DisplayName("SUPER_RESTRICAO: COORDENADOR e ADMIN também recebem acesso integral aos campos sensíveis")
    void perfisComSuperRestricaoTambemDevemVisualizarCamposSensiveis() throws Exception {
        String tokenCoordenador = jwtService.gerarToken(coordenadorUser);
        String tokenAdmin = jwtService.gerarToken(adminUser);

        // 1. Coordenador
        mockMvc.perform(get("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").exists())
                .andExpect(jsonPath("$.historicoSocioemocional").exists());

        SecurityContextHolder.clearContext();

        // 2. Admin
        mockMvc.perform(get("/api/v1/alunos/{estudanteId}/prontuario", alunoId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historicoFamiliar").exists())
                .andExpect(jsonPath("$.historicoSocioemocional").exists());
    }
}
