# Plano de Implementação: Autenticação JWT, Perfis RBAC e Revogação de Sessão (US 11)

Este documento descreve a implementação da **Task #50**, que entregou a base arquitetural completa da **US 11** no backend Spring Boot 3+ / Spring Security 6+ com PostgreSQL do projeto Sistema Integrado de Gestão Inclusiva (SIGI).

A implementação atende rigorosamente aos critérios de segurança institucional, RBAC granular e revogação imediata de tokens JWT (**TA11.4**).

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Configuração de Soft Delete na `BaseEntity` (`@SoftDelete` do Hibernate).
- [x] Estrutura de auditoria com `criadoEm`, `atualizadoEm`, `criadoPor` e `atualizadoPor`.
- [x] Implementação das entidades de domínio (`Aluno`, `Acompanhamento`, `Pei`, `Pea`, `EstudoDeCaso`).
- [x] Repositórios (Spring Data JPA) e CRUDs completos de PEA, PEI e Estudo de Caso.
- [x] `GlobalExceptionHandler` padronizando erros no formato **RFC 9457** (ProblemDetail).
- [x] Endpoint agregador da Linha do Tempo (US 09) e coleções Postman da US 02 e US 03.

**O que foi feito nesta Task (Checkpoint Atual - Dividido em Mini-Tasks):**
- [x] **Mini-Task 1 (Etapa 1)**: Banco de Dados, Migrations e Domínio — tabela `sigi.usuario`, enums RBAC, entidade `Usuario`, repositório com revogação atômica e massa de dados (seed).
- [x] **Mini-Task 2 (Etapa 2)**: Spring Security 6+, JJWT e filtro de sessão ativa — `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` e `AuthController`.
- [x] **Mini-Task 3 (Etapa 3)**: Endpoint de revogação e validação do **TA11.4** — `UsuarioAdminService`, `UsuarioAdminController`, suíte de testes de integração e script de ponta a ponta.

*O diferencial desta task é a **revogação imediata**: o token JWT deixa de valer no instante em que o ADMIN revoga o acesso, sem depender do tempo de expiração natural do token.*

## 2. Arquitetura em Camadas

A implementação foi organizada dentro da estrutura já existente em `com.br.CLAI`:

* `domain`
  * `enums`: Contém `Role` e `NivelRestricao`, que materializam o modelo de RBAC institucional.
* `security`: Contém `SecurityConfig` (cadeia de filtros e rotas públicas), `JwtService` (emissão/validação de tokens) e `JwtAuthenticationFilter` (verificação de sessão ativa por requisição).
* `repository`: Contém `UsuarioRepository`, responsável pelo acesso aos dados de usuário e pela query atômica de revogação.
* `service`: Contém `AuthService` (autenticação e emissão de token) e `UsuarioAdminService` (regra de revogação de acesso).
* `controller`: Contém `AuthController` (login e sessão corrente) e `UsuarioAdminController` (rota administrativa de revogação).
* `dto`
  * `request`: Contém `LoginRequestDTO`, usado para receber as credenciais.
  * `response`: Contém `LoginResponseDTO`, `UsuarioSessaoDTO` e `UsuarioRevogadoResponseDTO`.

### Arquivos criados ou alterados

- `src/main/java/com/br/CLAI/domain/Usuario.java`
- `src/main/java/com/br/CLAI/domain/enums/Role.java`
- `src/main/java/com/br/CLAI/domain/enums/NivelRestricao.java`
- `src/main/java/com/br/CLAI/repository/UsuarioRepository.java`
- `src/main/java/com/br/CLAI/security/SecurityConfig.java`
- `src/main/java/com/br/CLAI/security/JwtService.java`
- `src/main/java/com/br/CLAI/security/JwtAuthenticationFilter.java`
- `src/main/java/com/br/CLAI/security/UserDetailsServiceImpl.java`
- `src/main/java/com/br/CLAI/service/AuthService.java`
- `src/main/java/com/br/CLAI/service/UsuarioAdminService.java`
- `src/main/java/com/br/CLAI/controller/AuthController.java`
- `src/main/java/com/br/CLAI/controller/UsuarioAdminController.java`
- `src/main/java/com/br/CLAI/dto/request/LoginRequestDTO.java`
- `src/main/java/com/br/CLAI/dto/response/LoginResponseDTO.java`
- `src/main/java/com/br/CLAI/dto/response/UsuarioSessaoDTO.java`
- `src/main/java/com/br/CLAI/dto/response/UsuarioRevogadoResponseDTO.java`
- `src/test/java/com/br/CLAI/security/AuthRevocationIntegrationTest.java`
- `database/create_tables.sql` (tabela `sigi.usuario`)
- `pom.xml` (dependências de segurança e JJWT)
- `collection/US11/seed_test_data.sql`
- `collection/US11/test_revogacao_sessao.ps1`
- `collection/US11/SIGI_US11_Autenticacao_RBAC.postman_collection.json`
- `collection/US11/SIGI_US11_Environment.postman_environment.json`
- `collection/US11/README.md`

### Dependências adicionadas ao `pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

## 3. Detalhamento da Implementação

### 3.1 Etapa 1 - Banco de Dados, Migrations e Domínio

#### Tabela `sigi.usuario`

A tabela foi adicionada ao `create_tables.sql` com UUID, integridade relacional, soft-delete, auditoria herdada da `BaseEntity`, flag de sigilo médico e controle de sessão atômico:

```sql
CREATE TABLE sigi.usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    nivel_restricao VARCHAR(50) NOT NULL,
    autorizacao_saude BOOLEAN NOT NULL DEFAULT FALSE,
    acesso_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 1,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

CREATE INDEX idx_usuario_email ON sigi.usuario(email);
CREATE INDEX idx_usuario_role ON sigi.usuario(role);
```

Os três campos que sustentam a revogação imediata são:

| Campo | Função |
|---|---|
| `acesso_ativo` | Vincula do usuário. Quando `false`, nenhuma requisição autenticada é aceita. |
| `token_version` | Versão do token emitido. Incrementada a cada revogação, invalidando os tokens anteriores. |
| `autorizacao_saude` | Sigilo médico. Quando `true`, concede a authority `AUTH_SAUDE`. |

#### Enums RBAC

- `Role.java`: `ADMIN`, `COORDENADOR`, `CLAI_PSICOPEDAGOGO`, `PROFESSOR`, `ALUNO_APOIADOR`.
- `NivelRestricao.java`: `SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL`.

#### Entidade `Usuario`

A classe `Usuario` herda de `BaseEntity` (herdando `@SoftDelete` e auditoria) e implementa `UserDetails`. O mapeamento de `authorities` traduz o modelo de domínio em permissões do Spring Security:

```java
@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    List<GrantedAuthority> authorities = new ArrayList<>();
    if (this.role != null) {
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }
    if (this.nivelRestricao != null) {
        authorities.add(new SimpleGrantedAuthority("REST_" + this.nivelRestricao.name()));
    }
    if (Boolean.TRUE.equals(this.autorizacaoSaude)) {
        authorities.add(new SimpleGrantedAuthority("AUTH_SAUDE"));
    }
    return authorities;
}
```

As methods `isAccountNonLocked()` e `isEnabled()` retornam `false` quando `acessoAtivo` é `false`, o que impede a reautenticação de usuários revogados.

#### Repositório e revogação atômica

O `UsuarioRepository.java` possui busca por e-mail e uma query `@Modifying` que realiza a revogação de forma atômica, em uma única instrução:

```java
Optional<Usuario> findByEmail(String email);

boolean existsByEmail(String email);

@Modifying
@Query("UPDATE Usuario u SET u.tokenVersion = u.tokenVersion + 1, u.acessoAtivo = false WHERE u.id = :id")
int revogarAcessoPorId(@Param("id") UUID id);
```

#### Massa de Dados (Seed)

O arquivo `collection/US11/seed_test_data.sql` insere 5 usuários reais, com senhas criptografadas em BCrypt (`senha123`) e UUIDs fixos, de forma idempotente (`ON CONFLICT (email) DO NOTHING`):

| Nome | E-mail | Role | Nível de Restrição | Autorização Saúde |
|---|---|---|---|---|
| Administrador do Sistema | `admin@sigi.ifpb.edu.br` | `ADMIN` | `SUPER_RESTRICAO` | Sim |
| Aluno Apoiador Teste | `aluno.apoiador@sigi.ifpb.edu.br` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | Não |
| Coordenador Geral CLAI | `coordenador@sigi.ifpb.edu.br` | `COORDENADOR` | `SUPER_RESTRICAO` | Não |
| Psicopedagoga Médica Especialista | `psicopedagogo@sigi.ifpb.edu.br` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | Sim |
| Professor Titular | `professor@sigi.ifpb.edu.br` | `PROFESSOR` | `ACESSO_FUNCIONAL` | Não |

### 3.2 Etapa 2 - Spring Security 6+, JJWT e Filtro de Sessão Ativa

#### `JwtService` - geração e validação de tokens

O serviço gera tokens com as **claims obrigatórias** da US 11 e assina com HMAC (chave `sigi.security.jwt-secret`, expiração padrão `sigi.security.jwt-expiration-ms:28800000`):

```java
public String gerarToken(Usuario usuario) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", usuario.getRole().name());
    claims.put("nivelRestricao", usuario.getNivelRestricao().name());
    claims.put("autorizacaoSaude", Boolean.TRUE.equals(usuario.getAutorizacaoSaude()));
    claims.put("tokenVersion", usuario.getTokenVersion());
    claims.put("nome", usuario.getNome());
    if (usuario.getId() != null) {
        claims.put("userId", usuario.getId().toString());
    }
    ...
}
```

| Claim | Conteúdo | Finalidade |
|---|---|---|
| `role` | `Role` do usuário | Autorização por perfil (`ROLE_ADMIN`, `ROLE_PROFESSOR`, ...). |
| `nivelRestricao` | `NivelRestricao` do usuário | Autorização por nível de acesso ao prontuário. |
| `autorizacaoSaude` | `true` / `false` | Acesso a conteúdo de sigilo médico (`AUTH_SAUDE`). |
| `tokenVersion` | Inteiro incremental | Detecta tokens emitidos antes de uma revogação. |
| `userId` | UUID do usuário | Identificação do usuário no token. |
| `nome` | Nome do usuário | Exibição sem consulta adicional ao banco. |
| `sub` | E-mail do usuário | Identificador do sujeito, usado para localizar o registro. |

A validação contra a sessão ativa é centralizada no método:

```java
public boolean isTokenValidoParaSessaoAtiva(String token, Usuario usuario) {
    if (usuario == null || !Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
        return false;
    }
    ...
    return versaoToken != null
            && versaoToken.equals(usuario.getTokenVersion());
}
```

#### `JwtAuthenticationFilter` - verificação em tempo real

O filtro intercepta as requisições, valida a assinatura e realiza a verificação em tempo real no banco (`acessoAtivo == true` e `jwt.tokenVersion == usuario.tokenVersion`). Se o token for revogado, a requisição é encerrada com **HTTP 401 ProblemDetail** e o `SecurityContext` é limpo.

```text
Authorization: Bearer <token>
        ↓
JwtAuthenticationFilter
        ↓
  assinatura válida?
        │ não → 401 "Token JWT inválido ou expirado."
        ↓ sim
  usuário existe no banco?
        │ não → 401 "Usuário associado ao token não encontrado."
        ↓ sim
  acesso_ativo == true?
        │ não → 401 "Acesso revogado: o vínculo do usuário está desativado."
        ↓ sim
  tokenVersion do JWT == tokenVersion do banco?
        │ não → 401 "Sessão revogada ou versão do token inválida."
        ↓ sim
  SecurityContext populado com as authorities
```

#### `SecurityConfig` - política STATELESS

A configuração define sessão `STATELESS` (nenhum cookie ou `HttpSession` é criado), isenta as rotas públicas e restringe o painel administrativo por perfil:

```java
.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
...
.authorizeHttpRequests(auth -> auth
        .requestMatchers(
                "/api/v1/auth/login",
                "/actuator/**",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html"
        ).permitAll()
        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
)
```

O `authenticationEntryPoint` e o `accessDeniedHandler` respondem em **RFC 9457** com `401 Unauthorized` e `403 Forbidden` respectivamente.

#### `AuthController` - login e sessão corrente

- `POST /api/v1/auth/login` — autentica as credenciais via `AuthenticationManager` e devolve o token com as claims de RBAC.
- `GET /api/v1/auth/me` — retorna os dados do usuário autenticado e as `authorities` ativas no `SecurityContextHolder`.

### 3.3 Etapa 3 - Endpoint de Revogação e Validação do TA11.4

#### `UsuarioAdminService` e `UsuarioAdminController`

O `UsuarioAdminController` expõe a rota de revogação restrita ao perfil `ADMIN`, tanto pela regra de URL (`/api/v1/admin/**`) quanto pela anotação de método:

```java
@PatchMapping("/{id}/revogar-acesso")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<UsuarioRevogadoResponseDTO> revogarAcesso(@PathVariable UUID id) {
    return ResponseEntity.ok(usuarioAdminService.revogarAcesso(id));
}
```

O `UsuarioAdminService` executa a desativação da conta (`acessoAtivo = false`) e o incremento de `tokenVersion`:

```java
@Transactional
public UsuarioRevogadoResponseDTO revogarAcesso(UUID id) {
    Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado com o ID: " + id));

    usuario.setAcessoAtivo(false);
    usuario.incrementarTokenVersion();
    Usuario atualizado = usuarioRepository.save(usuario);
    ...
}
```

A resposta confirma o novo estado da sessão:

```json
{
  "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "email": "aluno.apoiador@sigi.ifpb.edu.br",
  "nome": "Aluno Apoiador Teste",
  "acessoAtivo": false,
  "tokenVersion": 2,
  "mensagem": "Acesso revogado com sucesso. Todas as sessões e tokens JWT anteriores foram invalidados imediatamente."
}
```

#### Fluxo de revogação

```text
              ALUNO_APOIADOR                ADMIN
                   │                          │
        POST /api/v1/auth/login               │
                   │                          │
        ◀── JWT (tokenVersion = 1)           │
                   │                          │
        GET /api/v1/auth/me  ──── 200 OK ────┤
                   │                          │
                   │        POST /api/v1/auth/login
                   │                          │
                   │        ◀── JWT (ROLE_ADMIN)
                   │                          │
                   │   PATCH /api/v1/admin/usuarios/{id}/revogar-acesso
                   │                          │
                   │        acesso_ativo = false
                   │        token_version  = 2
                   │                          │
        GET /api/v1/auth/me  ──── 401 Unauthorized
        (token antigo invalidado — TA11.4)
                   │
        POST /api/v1/auth/login ─── 401 Unauthorized
        (reautenticação bloqueada)
```

## 4. Endpoints Implementados

```http
POST /api/v1/auth/login
GET /api/v1/auth/me
PATCH /api/v1/admin/usuarios/{id}/revogar-acesso
```

| Método | Rota | Perfil Requerido | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | Autentica e emite o token JWT com as claims de RBAC, nível de restrição e `tokenVersion`. |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna os dados do usuário e as `authorities` ativas no `SecurityContextHolder`. |
| `PATCH` | `/api/v1/admin/usuarios/{id}/revogar-acesso` | `ADMIN` | **TA11.4**: invalida imediatamente qualquer JWT anterior (`token_version++`) e desativa o vínculo (`acesso_ativo = false`). |

## 5. Matriz de Validação dos Critérios de Aceite

| Critério de Aceite | Cenário Testado | Resultado |
|---|---|---|
| **CA 1 [TA11.4]** | Revogação de acesso pelo ADMIN invalida instantaneamente o JWT previamente emitido do ALUNO_APOIADOR. | **APROVADO** (HTTP 401 imediato no reuso do token). |
| **CA 2** | JWT carrega as claims obrigatórias (`role`, `nivelRestricao`, `autorizacaoSaude`, `tokenVersion`) e o contexto do Spring Security reflete os papéis. | **APROVADO** (payload e `authorities` conferidas). |
| **RBAC Isolation** | Usuário sem perfil ADMIN é bloqueado ao tentar acionar o endpoint de revogação. | **APROVADO** (HTTP 403 Forbidden). |
| **Bloqueio de Reautenticação** | Usuário revogado não consegue emitir novos tokens via login. | **APROVADO** (HTTP 401 Unauthorized). |
| **Sessão Ativa** | Token com `tokenVersion` defasada é rejeitado mesmo com usuário ativo no banco. | **APROVADO** (HTTP 401 Unauthorized). |

## 6. Testes Realizados

- [x] `POST /api/v1/auth/login` retornando `200 OK` com token e claims preenchidas.
- [x] `GET /api/v1/auth/me` retornando `200 OK` com as `authorities` esperadas.
- [x] Claims do JWT conferidas no payload: `role`, `nivelRestricao`, `autorizacaoSaude`, `tokenVersion` e `sub`.
- [x] `authorities` conferidas: `ROLE_ADMIN`, `REST_SUPER_RESTRICAO` e `AUTH_SAUDE`.
- [x] `PATCH /api/v1/admin/usuarios/{id}/revogar-acesso` retornando `200 OK` com `acessoAtivo = false` e `tokenVersion` incrementado.
- [x] Token anterior bloqueado com `401 Unauthorized` imediatamente após a revogação.
- [x] Reautenticação do usuário revogado bloqueada com `401 Unauthorized`.
- [x] Isolamento RBAC validado: perfil não-ADMIN recebe `403 Forbidden` na rota administrativa.
- [x] Token com versão defasada rejeitado com `401 Unauthorized`.

### Suíte de integração

O arquivo `AuthRevocationIntegrationTest.java` automatiza a cobertura dos critérios de aceite com `MockMvc` e `springSecurity()`:

| Teste (`@DisplayName`) | Cenário | Expectativa |
|---|---|---|
| CA 2: Deve autenticar com sucesso e emitir JWT com todas as claims | Login do ADMIN e leitura de `/api/v1/auth/me` | `200` + claims e `authorities` conferidas |
| RBAC: Usuário com perfil não-ADMIN deve ser bloqueado ao tentar revogar acesso | ALUNO_APOIADOR no `PATCH` de revogação | `403 Forbidden` |
| CA 1 [TA11.4]: Revogação Imediata | Login, uso do token, revogação pelo ADMIN e reuso do token antigo | `200` na revogação e `401` no reuso do token |
| Sessão Ativa: Token com tokenVersion defasada deve ser rejeitado | Token `v1` com usuário em `v2` | `401 Unauthorized` |

### Script de ponta a ponta

O arquivo `collection/US11/test_revogacao_sessao.ps1` executa o fluxo completo contra a aplicação em execução, cobrindo 7 passos:

1. Autenticação como `ALUNO_APOIADOR` (obtenção do token A).
2. Uso do token A em um recurso autenticado (HTTP 200).
3. Tentativa de violação RBAC pelo aluno apoiador (HTTP 403).
4. Autenticação do `ADMIN` (obtenção do token Admin).
5. Acionamento da revogação instantânea pelo `ADMIN` (TA11.4).
6. Uso do token A revogado (HTTP 401 — bloqueio imediato).
7. Tentativa de novo login do usuário revogado (HTTP 401).

```powershell
powershell -File app/backend/collection/US11/test_revogacao_sessao.ps1
```

### Coleção Postman

A pasta `collection/US11` contém a collection `SIGI_US11_Autenticacao_RBAC.postman_collection.json`, o environment `SIGI_US11_Environment.postman_environment.json`, o seed e o README com a matriz de usuários de teste. Os tokens `{{tokenAluno}}` e `{{tokenAdmin}}` são salvos automaticamente entre as requisições pelos scripts de teste da própria collection.

## 7. Ordem de Implementação e Commits

1. **Commit 1 (`a45f22e`)**: Criação da tabela `usuario`, dos enums RBAC e da entidade de domínio.

   ```text
   feat(auth): criar tabela usuario, enums rbac e entidade de dominio para task
   ```

2. **Commit 2 (`2bafd2f`)**: Configuração do Spring Security 6, geração de JWT com claims de RBAC e filtro de autenticação.

   ```text
   feat(security): configurar spring security 6, geracao de jwt com claims rbac e filtro de autenticacao
   ```

3. **Commit 3 (`bb0b23a`)**: Implementação da revogação instantânea de sessão e dos testes de aceite da US 11.

   ```text
   feat(auth): implementar revogacao instantanea de sessao e testes de aceite da us11
   ```

## 8. Resultado da Implementação

O fluxo final de autenticação e revogação ficou:

```text
POST /api/v1/auth/login
          ↓
    AuthService
          ↓
 AuthenticationManager (BCrypt)
          ↓
     JwtService  ──► claims: role, nivelRestricao,
          │          autorizacaoSaude, tokenVersion, nome, userId
          ▼
     JWT (Bearer)
          │
          ▼
  GET /api/v1/auth/me
          │
          ▼
JwtAuthenticationFilter
          │
          ├──► consulta ao banco: acesso_ativo + token_version
          │
          ├──► válido    ──► SecurityContext (ROLE_*, REST_*, AUTH_SAUDE) ──► Controller
          │
          └──► revogado  ──► 401 ProblemDetail (RFC 9457)

ADMIN ──► PATCH /api/v1/admin/usuarios/{id}/revogar-acesso
          │
          ▼
 UsuarioAdminService
          │
          ├──► acesso_ativo = false
          └──► token_version = token_version + 1
                    │
                    ▼
        Tokens anteriores invalidados (TA11.4)
```

Com isso, a US 11 entrega a fundação de segurança institucional do SIGI: autenticação por JWT com claims de RBAC, controle de sessão verificável em tempo real e revogação imediata de acesso, isolando corretamente os perfis e preparando o terreno para as restrições de prontuário sensível.

---

# Plano de Implementação: Motor de Criptografia em Repouso (AES-256) para Anexos Médicos Sensíveis (Task #51 - US 11)

Esta seção descreve a implementação da **Task #51**, que entregou o motor criptográfico JCA/JCE (`javax.crypto`) e o controle de acesso estrito em memória para anexos médicos sensíveis (laudos médicos e diagnósticos neuropsicológicos) da **US 11** em conformidade com a **LGPD (TA11.1, TA11.2 e TA3.2)**.

## 10. Visão Geral da Task #51 (Checkpoints)

**O que já havia sido preparado (Checkpoints Anteriores):**
- [x] Volume Docker dedicado (`attachments_data` montado em `/app/storage/anexos`) e variável `AES_KEY` de 256 bits (Task #46).
- [x] Contexto de segurança JWT e `Usuario` com `NivelRestricao` (`SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL`) e `autorizacaoSaude` (Task #50).

**O que foi feito nesta Task (Checkpoint Atual - Dividido em 3 Etapas / Commits):**
- [x] **Mini-Task 1 (Etapa 1 / Commit 1)**: Modelagem de metadados (`TipoClassificacaoAnexo`, `AnexoEstudante`, `AnexoEstudanteRepository`), migration SQL (`sigi.anexo_estudante`) e motor criptográfico `CryptoStorageService` (`AES/GCM/NoPadding` 256 bits, IV aleatório de 12 bytes e tag de autenticação de 128 bits).
- [x] **Mini-Task 2 (Etapa 2 / Commit 2)**: Endpoint de upload (`POST /api/v1/estudantes/{id}/anexos`) e persistência seletiva cifrada em repouso (**TA11.1**).
- [x] **Mini-Task 3 (Etapa 3 / Commit 3)**: Endpoint de download (`GET /api/v1/anexos/{anexoId}/download`) com controle de acesso estrito (`SUPER_RESTRICAO` + `autorizacaoSaude == true`), descriptografia exclusivamente em memória (**TA11.2 / TA3.2**), suítes de testes automatizados, script PowerShell e coleção Postman atualizada.

*O diferencial desta task é a **proteção criptográfica em repouso combinada com descriptografia zero-disk**: laudos médicos nunca ficam abertos no volume Docker ou no PostgreSQL e jamais geram arquivos temporários descriptografados em disco durante a leitura.*

## 11. Arquitetura em Camadas (Task #51)

A implementação seguiu o padrão em camadas de `com.br.CLAI`:

* `domain`
  * `enums`: Contém `TipoClassificacaoAnexo` (`LAUDO_MEDICO`, `DIAGNOSTICO_NEUROPSICOLOGICO`, `DOCUMENTO_PEDAGOGICO`), indicando quais categorias exigem criptografia obrigatória (`isSensivel()`).
  * `AnexoEstudante`: Entidade que persiste os metadados do arquivo, vínculo com `Aluno`, flag `criptografado`, caminho relativo no volume e o **Initialization Vector (IV)** em Base64.
* `repository`: Contém `AnexoEstudanteRepository`, responsável pela persistência e listagem de metadados por estudante.
* `service`:
  * `CryptoStorageService`: Motor criptográfico puro baseado na JCA/JCE (`javax.crypto.Cipher`, `SecretKeySpec`, `GCMParameterSpec`) e I/O seguro no volume com proteção contra *Path Traversal*.
  * `AnexoEstudanteService`: Orquestra a bifurcação de upload (cifrado vs. pedagógico) e a barreira de segurança para download em memória.
* `controller`: Contém `AnexoEstudanteController` (rotas de upload multipart, listagem de metadados e download binário seguro).
* `dto`
  * `response`: Contém `AnexoEstudanteResponseDTO` (omite intencionalmente `iv` e `caminhoArmazenamento`).

### Arquivos criados ou alterados na Task #51

- `src/main/java/com/br/CLAI/domain/enums/TipoClassificacaoAnexo.java`
- `src/main/java/com/br/CLAI/domain/AnexoEstudante.java`
- `src/main/java/com/br/CLAI/repository/AnexoEstudanteRepository.java`
- `src/main/java/com/br/CLAI/service/CryptoStorageService.java`
- `src/main/java/com/br/CLAI/service/AnexoEstudanteService.java`
- `src/main/java/com/br/CLAI/controller/AnexoEstudanteController.java`
- `src/main/java/com/br/CLAI/dto/response/AnexoEstudanteResponseDTO.java`
- `src/test/java/com/br/CLAI/service/CryptoStorageServiceTest.java`
- `src/test/java/com/br/CLAI/service/AnexoUploadIntegrationTest.java`
- `src/test/java/com/br/CLAI/security/AnexoSecurityIntegrationTest.java`
- `database/create_tables.sql` (tabela `sigi.anexo_estudante`)
- `database/04-create-anexo-estudante.sql`
- `collection/US11/test_criptografia_anexos.ps1`
- `collection/US11/SIGI_US11_Autenticacao_RBAC.postman_collection.json`
- `collection/US11/SIGI_US11_Environment.postman_environment.json`
- `collection/US11/README.md`

## 12. Detalhamento da Implementação (Task #51)

### 12.1 Etapa 1 - Motor Criptográfico (`CryptoStorageService`) e Modelagem de Metadados

#### Tabela `sigi.anexo_estudante`

A tabela armazena os metadados do documento e o vetor de inicialização (`iv`) necessário para a decifragem autenticada:

```sql
CREATE TABLE sigi.anexo_estudante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    classificacao VARCHAR(50) NOT NULL, -- Valores: LAUDO_MEDICO, DIAGNOSTICO_NEUROPSICOLOGICO, DOCUMENTO_PEDAGOGICO
    criptografado BOOLEAN NOT NULL DEFAULT FALSE,
    caminho_armazenamento VARCHAR(500) NOT NULL,
    iv VARCHAR(64), -- Initialization Vector (12 bytes em Base64) para AES-256-GCM
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

CREATE INDEX idx_anexo_estudante_aluno_id ON sigi.anexo_estudante(aluno_id);
CREATE INDEX idx_anexo_estudante_classificacao ON sigi.anexo_estudante(classificacao);
```

| Campo | Função |
|---|---|
| `classificacao` | Define se o documento é `LAUDO_MEDICO`, `DIAGNOSTICO_NEUROPSICOLOGICO` ou `DOCUMENTO_PEDAGOGICO`. |
| `criptografado` | Indica se os bytes persistidos no volume passaram pelo motor AES-256-GCM. |
| `caminho_armazenamento` | Caminho relativo dentro do volume montado (`/app/storage/anexos`), com extensão `.enc` para arquivos sensíveis. |
| `iv` | Vetor de inicialização de 12 bytes (96 bits) codificado em Base64, gerado exclusivamente para aquele arquivo. |

#### `CryptoStorageService` - Criptografia Autenticada `AES/GCM/NoPadding`

O serviço injeta a chave simétrica de 256 bits (`sigi.security.aes-key`) e o diretório do volume (`sigi.storage.attachments-dir`). A cada operação de cifragem, gera um **IV único de 12 bytes** com `SecureRandom` e aplica uma tag de integridade AEAD de **128 bits** (`GCMParameterSpec`):

```java
public EncryptedPayload encrypt(byte[] plaintext) {
    byte[] iv = new byte[GCM_IV_LENGTH_BYTES]; // 12 bytes (NIST SP 800-38D)
    secureRandom.nextBytes(iv);

    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

    byte[] ciphertext = cipher.doFinal(plaintext);
    String ivBase64 = Base64.getEncoder().encodeToString(iv);

    return new EncryptedPayload(ciphertext, iv, ivBase64);
}
```

A descriptografia ocorre **estritamente em memória** (`byte[]`), validando a tag de autenticação GCM de 128 bits antes de liberar qualquer byte:

```java
public byte[] decrypt(byte[] ciphertext, byte[] iv) {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
    cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

    return cipher.doFinal(ciphertext);
}
```

### 12.2 Etapa 2 - Upload e Persistência Seletiva Cifrada (TA11.1)

O método `uploadAnexo` em `AnexoEstudanteService` verifica a sensibilidade da classificação (`classificacao.isSensivel()`):

- **`LAUDO_MEDICO` e `DIAGNOSTICO_NEUROPSICOLOGICO`**: os bytes originais são cifrados em memória com `cryptoStorageService.encrypt(bytesOriginais)`, apenas o `ciphertext` (sem o cabeçalho `%PDF-`) é gravado no volume com sufixo `.enc`, e o `ivBase64` é persistido na entidade `AnexoEstudante`.
- **`DOCUMENTO_PEDAGOGICO`**: gravado no volume sem exigir chave médica (`criptografado = false`, `iv = null`).

### 12.3 Etapa 3 - Download com Controle de Acesso Estrito em Memória (TA11.2 / TA3.2)

Quando `GET /api/v1/anexos/{anexoId}/download` é acionado para um anexo sensível, o `AnexoEstudanteService` exige simultaneamente duas condições no `Usuario` autenticado no `SecurityContextHolder`:

```java
private void validarAcessoEstritoSaude(Usuario usuario) {
    boolean autorizado = usuario != null
            && usuario.getNivelRestricao() == NivelRestricao.SUPER_RESTRICAO
            && Boolean.TRUE.equals(usuario.getAutorizacaoSaude());

    if (!autorizado) {
        throw new AcessoNegadoException(
                "Acesso negado: visualização e descriptografia de anexos médicos sensíveis restrita a profissionais com nível SUPER_RESTRICAO e autorização de saúde ativa."
        );
    }
}
```

Caso qualquer uma das duas condições falhe, a `AcessoNegadoException` é convertida pelo `GlobalExceptionHandler` em **HTTP `403 Forbidden`** no padrão ProblemDetail (RFC 9457), impedindo que a descriptografia seja sequer iniciada.

#### Fluxo de Upload Cifrado e Download Restrito em Memória

```text
   UPLOAD (POST /api/v1/estudantes/{id}/anexos)
                  │
                  ▼
     classificacao.isSensivel()?
       ├── sim (LAUDO_MEDICO / DIAGNOSTICO_NEUROPSICOLOGICO)
       │     ├──► SecureRandom gera IV único (12 bytes)
       │     ├──► Cipher AES/GCM/NoPadding (256 bits, tag 128 bits)
       │     ├──► Volume Docker (/app/storage/anexos/*.enc) ◄── bytes cifrados (sem %PDF-)
       │     └──► PostgreSQL (sigi.anexo_estudante)         ◄── iv (Base64) + criptografado=true
       │
       └── não (DOCUMENTO_PEDAGOGICO)
             └──► Volume Docker + PostgreSQL (criptografado=false, iv=null)

   DOWNLOAD (GET /api/v1/anexos/{anexoId}/download)
                  │
                  ▼
     anexo.getClassificacao().isSensivel()?
       ├── sim ──► NivelRestricao == SUPER_RESTRICAO && autorizacaoSaude == true?
       │             ├── não ──► 403 Forbidden (ProblemDetail — TA11.2 / TA3.2)
       │             └── sim ──► Lê .enc do volume + IV do banco
       │                           └──► Descriptografa exclusivamente em RAM (byte[])
       │                                  └──► 200 OK (application/pdf, Cache-Control: no-store)
       └── não ──► 200 OK (para usuários autenticados)
```

## 13. Endpoints Implementados na Task #51

```http
POST /api/v1/estudantes/{id}/anexos
GET  /api/v1/estudantes/{id}/anexos
GET  /api/v1/anexos/{anexoId}/download
```

| Método | Rota | Perfil Requerido | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/estudantes/{id}/anexos` | Autenticado | **TA11.1**: Recebe `MultipartFile` e `classificacao`. Cifra com AES-256-GCM se for laudo médico ou diagnóstico neuropsicológico. |
| `GET` | `/api/v1/estudantes/{id}/anexos` | Autenticado | Lista os metadados dos anexos vinculados ao estudante (sem expor `iv` ou caminho físico). |
| `GET` | `/api/v1/anexos/{anexoId}/download` | `SUPER_RESTRICAO` + `autorizacaoSaude=true` *(para laudos)* | **TA11.2 / TA3.2**: Valida permissão estrita de saúde, descriptografa em memória e retorna o binário original. |

## 14. Matriz de Validação dos Critérios de Aceite (Task #51)

| Critério de Aceite | Cenário Testado | Resultado |
|---|---|---|
| **CA 1 [TA11.1]** | Arquivo enviado como `LAUDO_MEDICO` ou `DIAGNOSTICO_NEUROPSICOLOGICO` é gravado cifrado no volume (sem magic bytes `%PDF-` e sem texto clínico em claro). | **APROVADO** (inspeção direta dos bytes em disco confirmada). |
| **CA 2 [TA11.2]** | Download por usuário com `SUPER_RESTRICAO` e `autorizacaoSaude = true` descriptografa exclusivamente em memória e retorna o PDF íntegro. | **APROVADO** (HTTP 200 OK, bytes idênticos ao PDF original, zero arquivos temporários em disco). |
| **CA 3 [TA11.2 / TA3.2]** | Bloqueio de download de anexo sensível para Professor, Coordenador (`autorizacaoSaude=false`), Admin de TI (`autorizacaoSaude=false`), Psicopedagogo (`RESTRICAO_MODERADA`) e Aluno Apoiador. | **APROVADO** (HTTP 403 Forbidden em todos os perfis não autorizados). |
| **Integridade AEAD** | Adulteração de 1 bit no arquivo `.enc` no disco ou divergência de IV/chave é detectada pela tag GCM de 128 bits. | **APROVADO** (`SecurityException` / `AEADBadTagException` bloqueia a leitura). |

## 15. Testes Realizados na Task #51

### Suítes automatizadas (JUnit 5 + MockMvc)

1. **`CryptoStorageServiceTest.java`** (6 testes unitários):
   - Cifragem AES-256-GCM e decifragem em memória preservando 100% dos bytes originais.
   - Geração de IVs de 12 bytes e ciphertexts distintos para arquivos idênticos.
   - Detecção de adulteração nos bytes cifrados (tag AEAD GCM de 128 bits).
   - Bloqueio quando o IV ou a chave AES de 256 bits divergem.
   - Validação de tamanho da chave AES (32 bytes UTF-8 ou 64 hex).
   - Gravação/leitura no volume e bloqueio de *Path Traversal* (`../../`).

2. **`AnexoUploadIntegrationTest.java`** (4 testes de integração):
   - Upload de `LAUDO_MEDICO` e inspeção física do arquivo `.enc` no volume comprovando ausência de `%PDF-` e de dados clínicos abertos (**TA11.1**).
   - Upload cifrado de `DIAGNOSTICO_NEUROPSICOLOGICO`.
   - Upload padrão de `DOCUMENTO_PEDAGOGICO` (`criptografado = false`, `iv = null`).
   - Retorno `404 Not Found` para estudante inexistente.

3. **`AnexoSecurityIntegrationTest.java`** (4 testes de integração com `JwtAuthenticationFilter` real):
   - **CA 1 + CA 2**: Upload cifrado e download em memória (`200 OK`) para usuário com `SUPER_RESTRICAO` + `autorizacaoSaude = true`, verificando que nenhum arquivo temporário aberto foi criado no volume.
   - **CA 3**: Bloqueio com `403 Forbidden` para Professor, Coordenador (`SUPER_RESTRICAO` + `autorizacaoSaude = false`), Admin de TI (`SUPER_RESTRICAO` + `autorizacaoSaude = false`), Psicopedagogo (`RESTRICAO_MODERADA` + `autorizacaoSaude = true`) e Aluno Apoiador.
   - Permissão normal (`200 OK`) para download de `DOCUMENTO_PEDAGOGICO` por Professor e Coordenador autenticados.
   - Retorno `404 Not Found` para anexo inexistente.

### Script de ponta a ponta (Task #51)

```powershell
powershell -File app/backend/collection/US11/test_criptografia_anexos.ps1
```

## 16. Ordem de Implementação e Commits (Task #51)

1. **Commit 1 (`f111db0`)**: Motor criptográfico AES-256-GCM e modelagem de metadados do anexo.

   ```text
   feat(security): implementar motor criptografico AES-256-GCM e modelagem de anexo estudante (#51)
   ```

2. **Commit 2 (`c1d1c91`)**: Endpoint de upload e persistência seletiva cifrada em repouso (TA11.1).

   ```text
   feat(storage): implementar upload e persistencia seletiva cifrada de laudos em repouso (#51)
   ```

3. **Commit 3**: Endpoint de download com controle estrito em memória e testes de aceite TA11.2 / TA3.2.

   ```text
   feat(security): implementar download de laudos com controle estrito em memoria e testes TA11.2 (#51)
   ```

## 17. Próximos Passos (Trabalhos Futuros)

1. **Auditoria de acesso a anexos médicos:** registrar em log de auditoria LGPD cada operação de visualização/descriptografia bem-sucedida ou negada (`403 Forbidden`) de laudos sensíveis.
2. **Refresh token:** emitir tokens de curta duração com rotação por `refresh_token`, mantendo a revogação imediata válida para ambas as sessões.
3. **Rotação de chave simétrica (Key Rotation):** suporte a versionamento de chave AES (`key_version`) para permitir rotação periódica de `AES_KEY` em produção.

