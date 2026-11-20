package com.br.CLAI.security;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.service.AnexoEstudanteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("RBAC Dinâmico por Cargo para Laudos Médicos no Estudo de Caso")
class LaudoMedicoRbacEstudoCasoIntegrationTest {

    private static Path tempStorageDir;

    @DynamicPropertySource
    static void configurarVolumeTemporario(DynamicPropertyRegistry registry) throws IOException {
        tempStorageDir = Files.createTempDirectory("sigi-laudos-rbac-test-");
        registry.add("sigi.storage.attachments-dir", () -> tempStorageDir.toAbsolutePath().toString());
    }

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private AnexoEstudanteService anexoEstudanteService;

    private MockMvc mockMvc;

    private Usuario coordenador;
    private Usuario admin;
    private Usuario psicopedagogo;
    private Usuario professor;
    private Usuario alunoApoiador;

    private Aluno aluno;
    private byte[] pdfLaudoOriginal;
    private AnexoEstudanteResponseDTO laudoMedico;
    private AnexoEstudanteResponseDTO documentoPedagogico;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        coordenador = criarUsuario("Coordenadora CLAI", "coord.laudo@sigi.ifpb.edu.br", Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO, false);
        admin = criarUsuario("Admin Sistema", "admin.laudo@sigi.ifpb.edu.br", Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true);
        psicopedagogo = criarUsuario("Psicopedagogo CLAI", "psico.laudo@sigi.ifpb.edu.br", Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true);
        professor = criarUsuario("Professor Titular", "prof.laudo@sigi.ifpb.edu.br", Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        alunoApoiador = criarUsuario("Aluno Apoiador", "apoiador.laudo@sigi.ifpb.edu.br", Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL, false);

        aluno = new Aluno("Estudante Laudo Teste", "2026-LAUDO-" + UUID.randomUUID().toString().substring(0, 6));
        aluno.setCurso("Informática");
        aluno.setTurma("P2");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(true);
        aluno = alunoRepository.saveAndFlush(aluno);

        pdfLaudoOriginal = "%PDF-1.7\nLaudo Médico Confidencial CID F84.0\n%%EOF".getBytes(StandardCharsets.UTF_8);
        laudoMedico = anexoEstudanteService.uploadAnexo(
                aluno.getId(),
                new MockMultipartFile("arquivo", "laudo_medico_estudo.pdf", MediaType.APPLICATION_PDF_VALUE, pdfLaudoOriginal),
                TipoClassificacaoAnexo.LAUDO_MEDICO
        );

        documentoPedagogico = anexoEstudanteService.uploadAnexo(
                aluno.getId(),
                new MockMultipartFile("arquivo", "plano_pedagogico.pdf", MediaType.APPLICATION_PDF_VALUE, "%PDF-1.4 Pedagógico".getBytes(StandardCharsets.UTF_8)),
                TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO
        );
    }

    private Usuario criarUsuario(String nome, String email, Role role, NivelRestricao nivel, boolean authSaude) {
        Usuario u = new Usuario(nome, email, "$2a$10$hash", role, nivel, authSaude);
        u.setAcessoAtivo(true);
        u.setTokenVersion(1);
        return usuarioRepository.saveAndFlush(u);
    }

    @Test
    @DisplayName("Por padrão apenas COORDENADOR visualiza e baixa LAUDO_MEDICO; demais cargos não veem na listagem e recebem 403 no download")
    void deveRestringirLaudoMedicoApenasAoCoordenadorPorPadrao() throws Exception {
        String tokenCoord = jwtService.gerarToken(coordenador);

        // Coordenador vê o laudo na listagem de laudos e na listagem geral (incluindo rolesPermitidas = [])
        mockMvc.perform(get("/api/alunos/{id}/laudos-medicos", aluno.getId())
                        .header("Authorization", "Bearer " + tokenCoord))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(laudoMedico.id().toString()))
                .andExpect(jsonPath("$[0].classificacao").value("LAUDO_MEDICO"))
                .andExpect(jsonPath("$[0].rolesPermitidas", hasSize(0)));

        MvcResult downloadCoord = mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenCoord))
                .andExpect(status().isOk())
                .andReturn();
        assertArrayEquals(pdfLaudoOriginal, downloadCoord.getResponse().getContentAsByteArray());

        // Todos os demais cargos (ADMIN, CLAI_PSICOPEDAGOGO, PROFESSOR, ALUNO_APOIADOR) não veem nem baixam
        for (Usuario usuarioSemPermissao : new Usuario[]{admin, psicopedagogo, professor, alunoApoiador}) {
            String token = jwtService.gerarToken(usuarioSemPermissao);

            mockMvc.perform(get("/api/alunos/{id}/laudos-medicos", aluno.getId())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            // Na listagem geral de anexos, vê apenas o DOCUMENTO_PEDAGOGICO (LAUDO_MEDICO filtrado)
            mockMvc.perform(get("/api/alunos/{id}/anexos", aluno.getId())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id").value(documentoPedagogico.id().toString()));

            mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Coordenador libera e revoga cargos dinamicamente; acesso é concedido e bloqueado imediatamente na listagem e no download")
    void deveLiberarERevogarAcessoPorCargoDinamicamente() throws Exception {
        String tokenCoord = jwtService.gerarToken(coordenador);
        String tokenProf = jwtService.gerarToken(professor);
        String tokenPsico = jwtService.gerarToken(psicopedagogo);

        // 1. Coordenador libera PROFESSOR e CLAI_PSICOPEDAGOGO
        mockMvc.perform(put("/api/anexos/{anexoId}/permissoes-acesso", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenCoord)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rolesPermitidas\":[\"PROFESSOR\",\"CLAI_PSICOPEDAGOGO\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rolesPermitidas", containsInAnyOrder("PROFESSOR", "CLAI_PSICOPEDAGOGO")));

        // 2. PROFESSOR passa a visualizar e baixar imediatamente (sem expor rolesPermitidas no DTO)
        mockMvc.perform(get("/api/alunos/{id}/laudos-medicos", aluno.getId())
                        .header("Authorization", "Bearer " + tokenProf))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(laudoMedico.id().toString()))
                .andExpect(jsonPath("$[0].rolesPermitidas").doesNotExist());

        MvcResult downloadProf = mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenProf))
                .andExpect(status().isOk())
                .andReturn();
        assertArrayEquals(pdfLaudoOriginal, downloadProf.getResponse().getContentAsByteArray());

        // ALUNO_APOIADOR continua bloqueado
        String tokenApoiador = jwtService.gerarToken(alunoApoiador);
        mockMvc.perform(get("/api/alunos/{id}/laudos-medicos", aluno.getId())
                        .header("Authorization", "Bearer " + tokenApoiador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenApoiador))
                .andExpect(status().isForbidden());

        // 3. Coordenador revoga PROFESSOR (mantendo apenas CLAI_PSICOPEDAGOGO)
        mockMvc.perform(put("/api/anexos/{anexoId}/permissoes-acesso", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenCoord)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rolesPermitidas\":[\"CLAI_PSICOPEDAGOGO\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rolesPermitidas", hasSize(1)))
                .andExpect(jsonPath("$.rolesPermitidas[0]").value("CLAI_PSICOPEDAGOGO"));

        // PROFESSOR volta a ser bloqueado imediatamente
        mockMvc.perform(get("/api/alunos/{id}/laudos-medicos", aluno.getId())
                        .header("Authorization", "Bearer " + tokenProf))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenProf))
                .andExpect(status().isForbidden());

        // CLAI_PSICOPEDAGOGO continua com acesso
        mockMvc.perform(get("/api/anexos/{anexoId}/download", laudoMedico.id())
                        .header("Authorization", "Bearer " + tokenPsico))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Apenas COORDENADOR pode alterar permissões de laudo (403 para demais cargos) e apenas para LAUDO_MEDICO (400 para outros anexos)")
    void deveBloquearAlteracaoDePermissoesPorNaoCoordenadorEParaNaoLaudo() throws Exception {
        for (Usuario naoCoordenador : new Usuario[]{admin, psicopedagogo, professor, alunoApoiador}) {
            String token = jwtService.gerarToken(naoCoordenador);
            mockMvc.perform(put("/api/anexos/{anexoId}/permissoes-acesso", laudoMedico.id())
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"rolesPermitidas\":[\"PROFESSOR\"]}"))
                    .andExpect(status().isForbidden());
        }

        String tokenCoord = jwtService.gerarToken(coordenador);
        mockMvc.perform(put("/api/anexos/{anexoId}/permissoes-acesso", documentoPedagogico.id())
                        .header("Authorization", "Bearer " + tokenCoord)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rolesPermitidas\":[\"PROFESSOR\"]}"))
                .andExpect(status().isBadRequest());
    }
}
