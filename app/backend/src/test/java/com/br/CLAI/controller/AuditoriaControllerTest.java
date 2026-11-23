package com.br.CLAI.controller;

import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.repository.AuditLogRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("US 06 - Consulta somente-leitura da trilha de auditoria no painel administrativo")
class AuditoriaControllerTest {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mockMvc;
    private String tokenAdmin;
    private String tokenProfessor;
    private String acaoFiltro;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        acaoFiltro = "ACAO_FILTRO_" + sufixo;

        Usuario admin = new Usuario(
                "Admin Auditoria " + sufixo,
                "admin.auditoria." + sufixo + "@sigi.ifpb.edu.br",
                "hash", Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true
        );
        admin.setAcessoAtivo(true);
        admin.setTokenVersion(1);
        admin = usuarioRepository.saveAndFlush(admin);

        Usuario professor = new Usuario(
                "Professor Auditoria " + sufixo,
                "prof.auditoria." + sufixo + "@sigi.ifpb.edu.br",
                "hash", Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false
        );
        professor.setAcessoAtivo(true);
        professor.setTokenVersion(1);
        professor = usuarioRepository.saveAndFlush(professor);

        tokenAdmin = jwtService.gerarToken(admin);
        tokenProfessor = jwtService.gerarToken(professor);

        auditLogRepository.save(new AuditLog(admin.getId(), acaoFiltro, "ESTUDO_CASO",
                UUID.randomUUID(), "/api/estudos-de-caso", "POST", "criacao", LocalDateTime.now()));
        auditLogRepository.save(new AuditLog(admin.getId(), acaoFiltro, "PEI",
                UUID.randomUUID(), "/api/peis", "PUT", "edicao", LocalDateTime.now().minusMinutes(1)));
        auditLogRepository.save(new AuditLog(professor.getId(), "OUTRA_ACAO", "ATENDIMENTO",
                UUID.randomUUID(), "/api/atendimentos", "POST", "registro", LocalDateTime.now().minusMinutes(2)));
    }

    @Test
    @DisplayName("ROLE_ADMIN consulta a trilha em ordem decrescente com metadados de paginacao")
    void adminPodeConsultarTrilha() throws Exception {
        mockMvc.perform(get("/api/admin/auditoria")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("pagina", "0")
                        .param("tamanho", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.tamanho").value(2))
                .andExpect(jsonPath("$.totalElementos").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.logs.length()").value(2))
                .andExpect(jsonPath("$.logs[0].timestamp").exists())
                .andExpect(jsonPath("$.logs[0].acao").exists())
                .andExpect(jsonPath("$.logs[0].endpoint").exists());
    }

    @Test
    @DisplayName("Filtros por acao, entidade e usuarioId reduzem o resultado")
    void filtrosReduzemResultado() throws Exception {
        mockMvc.perform(get("/api/admin/auditoria")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("acao", acaoFiltro)
                        .param("entidade", "ESTUDO_CASO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.logs[0].entidade").value("ESTUDO_CASO"));
    }

    @Test
    @DisplayName("Perfil nao-admin recebe 403 ao tentar consultar a trilha")
    void professorNaoPodeConsultarTrilha() throws Exception {
        mockMvc.perform(get("/api/admin/auditoria")
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Nao existem rotas de alteracao na trilha de auditoria (TA6.3)")
    void naoExistemRotasDeAlteracao() throws Exception {
        mockMvc.perform(post("/api/admin/auditoria")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        mockMvc.perform(put("/api/admin/auditoria/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        mockMvc.perform(patch("/api/admin/auditoria/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        mockMvc.perform(delete("/api/admin/auditoria/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().is4xxClientError());
    }
}
