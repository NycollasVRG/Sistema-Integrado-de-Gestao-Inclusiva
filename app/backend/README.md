# SIGI / CLAI — Documentação Técnica do Back-end

API REST do **Sistema Integrado de Gestão Inclusiva (SIGI)** da **Coordenação Local de Acessibilidade e Inclusão (CLAI)** do IFPB.

- Código-fonte do back-end: [`app/backend`](.)
- Front-end (React/Vite): [`app/frontend`](../frontend/README.md)
- Execução completa via Docker (db + backend + frontend): [`DOCKER_GUIDE.md`](../../DOCKER_GUIDE.md)
- Migrations e seeds do banco: [`src/main/resources/db/`](src/main/resources/db)

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto-sigi--clai)
2. [Arquitetura e Comportamento do Sistema](#2-arquitetura-e-comportamento-do-sistema)
3. [Como Configurar e Executar o Projeto Localmente](#3-como-configurar-e-executar-o-projeto-localmente)
4. [Catálogo de Endpoints da API](#4-catálogo-de-endpoints-da-api)
5. [Tratamento de Erros e Exceções](#5-tratamento-de-erros-e-exceções-handler-e-exception)
6. [Como Testar a API no Postman](#6-como-testar-a-api-no-postman-collection)

---

## 1. Visão Geral do Projeto (SIGI / CLAI)

### Propósito da API

A API centraliza o acompanhamento pedagógico de estudantes com necessidades específicas e expõe:

| Módulo | O que faz |
| :--- | :--- |
| **Gestão de Alunos (US 12)** | Cadastro de estudantes, filtros multicritério combinados (termo em nome/matrícula, curso, turma, tag/tagAcessibilidade, status ativo), atualização cadastral, inativação lógica com preservação de vínculos históricos (`INATIVO` / `EVADIDO`) e vínculo a tags de dificuldade. |
| **Catálogo de Indicadores** | Consulta do catálogo de tags/indicadores reutilizáveis ativos para formulários e filtros. |
| **Estudo de Caso** | Registro do diagnóstico inicial, indicadores reutilizáveis (barreiras/necessidades) e **histórico familiar/socioemocional (dados sensíveis)**. Ciclo `RASCUNHO` → `ATIVO` → `ENCERRADO`. |
| **Planejamento Pedagógico (PEI / PEA)** | **PEI** (Plano de Ensino Individualizado) e **PEA** (Plano de Ensino Adaptado, por disciplina), ambos vinculados a um *Acompanhamento* do aluno. |
| **Timeline** | Linha do tempo cronológica unificada (Estudo de Caso, PEI e PEA) do aluno. |
| **Prontuário Unificado** | Consolidado do estudante (estudo vigente, totais de PEI/PEA/anexos) com projeção condicional de dados sensíveis. |
| **Anexos do Estudante** | Upload/download de documentos; laudos e diagnósticos são **criptografados em repouso (AES-256-GCM)**. |
| **Autenticação e RBAC** | Login com JWT, perfis (`Role`), níveis de restrição (`NivelRestricao`), autorização de saúde e revogação imediata de sessão. |

### Stack tecnológica (extraída de [`app/backend/pom.xml`](pom.xml), [`docker-compose.yml`](../../docker-compose.yml) e [`Dockerfile`](Dockerfile))

| Tecnologia | Versão / Detalhe |
| :--- | :--- |
| **Java** | 21 (`java.version`; imagem `eclipse-temurin:21`) |
| **Spring Boot** | 4.1.1 (`spring-boot-starter-parent`) |
| **Spring WebMVC** | `spring-boot-starter-webmvc` (CORS configurável por ambiente) |
| **Spring Security** | `spring-boot-starter-security` + `spring-boot-starter-security-oauth2-resource-server` (stateless, Resource Server nativo, `@EnableMethodSecurity`) |
| **Spring Data JPA / Hibernate** | `spring-boot-starter-data-jpa` (`ddl-auto: validate`, `@SoftDelete`, JPA Auditing, `open-in-view: false`, `@EntityGraph`) |
| **Flyway** | `spring-boot-starter-flyway` + `flyway-database-postgresql` (`db/migration` estrutural e `db/seed/dev` apenas em `dev`) |
| **Bean Validation** | `spring-boot-starter-validation` |
| **Actuator** | `spring-boot-starter-actuator` (health check do container) |
| **JWT** | Spring Security OAuth2 Resource Server + Nimbus JOSE/JWT (HS256 via `NimbusJwtEncoder` / `NimbusJwtDecoder` com chave HMAC-SHA256) |
| **Senhas** | `BCryptPasswordEncoder` |
| **Banco de dados** | **PostgreSQL 16** (`postgres:16-alpine`; compatível com 14+) + driver `org.postgresql:postgresql` |
| **DevTools** | `spring-boot-devtools` (runtime, opcional) |
| **Testes** | starters de teste (actuator, data-jpa, validation, webmvc) + `spring-security-test` |
| **Build** | Maven (wrapper `mvnw` incluso) · Artefato `com.br:CLAI:0.0.1-SNAPSHOT` |
| **Erros** | RFC 9457 — `ProblemDetail` (`application/problem+json`) |

---

## 2. Arquitetura e Comportamento do Sistema

### Estrutura de pacotes (`com.br.CLAI`)

| Pacote | Papel |
| :--- | :--- |
| `controller` | Endpoints REST: `AuthController`, `UsuarioAdminController`, `AlunoController`, `IndicadorReutilizavelController`, `EstudoDeCasoController`, `ProntuarioController`, `PeiController`, `PeaController`, `AnexoEstudanteController`, `TimelineController`. |
| `domain` | Entidades JPA (`schema = sigi`) que herdam de `BaseEntity`: `Usuario`, `Aluno`, `Acompanhamento`, `EstudoDeCaso`, `IndicadorReutilizavel`, `PlanoAcao`, `Pei`, `Pea`, `AnexoEstudante`. Subpacote `domain.enums`: `Role`, `NivelRestricao`, `StatusAluno`, `StatusEstudoCaso`, `TipoClassificacaoAnexo`. |
| `dto` | Contratos da API como `record`s Java. `dto.request` (`AlunoRequestDTO`, `EstudoDeCasoRequestDTO`, etc.) e `dto.response` (`AlunoResponseDTO`, etc.). |
| `exception` | Exceções de negócio: `NaoEncontradoException`, `RegraDeNegocioException`, `AcessoNegadoException`, `ConflitoException`. |
| `handler` | `GlobalExceptionHandler` (`@RestControllerAdvice`) → converte exceções em `ProblemDetail` (RFC 9457). |
| `mapper` | Conversão manual Entidade ↔ DTO (`AlunoMapper`, `EstudoDeCasoMapper`, `PeaMapper`, `PeiMapper`). O `EstudoDeCasoMapper` e `ProntuarioService` aplicam a omissão de dados sensíveis. |
| `repository` | Interfaces Spring Data JPA com `@EntityGraph` para prevenção de *N+1 queries*. |
| `security` | `SecurityConfig`, `JwtService`, `RbacGuard`, `UserDetailsServiceImpl`. |
| `service` | Regras de negócio e orquestração (`AlunoService`, `IndicadorReutilizavelService`, `EstudoDeCasoService`, `PeiService`, `PeaService`, `ProntuarioService`, `TimelineService`, `AnexoEstudanteService`, `CryptoStorageService`, `AuthService`, `UsuarioAdminService`). Subpacote `service.validator` → `EstudoDeCasoValidator`. |

### Comportamentos padrão da API

#### 2.1 Autenticação e Autorização (RBAC)

**Login e token**

1. `POST /api/auth/login` com `email` e `senha` (BCrypt). Retorna `token`, `tipoToken = "Bearer"` e dados do usuário (`LoginResponseDTO`).
2. Todas as demais rotas de negócio exigem o header:
   ```http
   Authorization: Bearer <token>
   ```
3. O JWT (HS256) tem `subject = email` e as claims `role`, `nivelRestricao`, `autorizacaoSaude`, `tokenVersion`, `nome`, `userId`. Expiração padrão: **8 h** (`sigi.security.jwt-expiration-ms`, padrão `28800000`).
4. A sessão é **stateless** (`SessionCreationPolicy.STATELESS`, CSRF desabilitado).
5. O **Spring Security OAuth2 Resource Server** valida o token JWT a cada requisição via `NimbusJwtDecoder`. Um validador customizado (`sessionValidator`) assegura a existência do usuário, que seu vínculo está ativo (`acessoAtivo = true`) e que o `tokenVersion` da claim é idêntico ao registrado no banco. O usuário autenticado é injetado como `@AuthenticationPrincipal Jwt` nos controllers, e o ID do auditor (`criadoPor`/`atualizadoPor`) é extraído confiavelmente da claim `userId` pelo `RbacGuard.exigirUsuarioAutenticadoId(...)` — o header `X-User-Id` **não é lido** pelo back-end.
6. **Revogação imediata (TA11.4):** `PATCH /api/admin/usuarios/{id}/revogar-acesso` define `acessoAtivo = false` e incrementa `tokenVersion`; tokens anteriores passam a receber `401`.

**Regras do `SecurityFilterChain`** ([`SecurityConfig`](src/main/java/com/br/CLAI/security/SecurityConfig.java))

| Rota | Regra |
| :--- | :--- |
| `POST /api/auth/login`, `/actuator/**`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` | Pública |
| `/api/admin/**` | `hasRole('ADMIN')` |
| Qualquer outra (`/api/**`) | Autenticada |

**CORS (Cross-Origin Resource Sharing)**

A API possui `CorsConfigurationSource` configurado em `SecurityConfig` liberando:
- Origem permitida: `http://localhost:5173` (SPA Frontend)
- Métodos permitidos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Cabeçalhos permitidos: `Authorization`, `Content-Type`, `Accept`

**Perfis e níveis** (enums de `domain.enums`)

| `Role` | Authority gerada | `NivelRestricao` | Authority gerada |
| :--- | :--- | :--- | :--- |
| `ADMIN`, `COORDENADOR`, `CLAI_PSICOPEDAGOGO`, `PROFESSOR`, `ALUNO_APOIADOR` | `ROLE_<ROLE>` | `SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL` | `REST_<NIVEL>` |

Além disso, `autorizacaoSaude = true` gera a authority `AUTH_SAUDE`.

**Matriz granular (Task #52 — TA11.3 / TA3.2)** — implementada por [`RbacGuard`](src/main/java/com/br/CLAI/security/RbacGuard.java):

| Perfil (nível) | Dados sensíveis no Estudo de Caso / Prontuário | `GET .../historico-socioemocional` | `GET /api/peis/{id}/anexos-sensiveis` |
| :--- | :--- | :--- | :--- |
| `PROFESSOR`, `ALUNO_APOIADOR` (`ACESSO_FUNCIONAL`) | **Omitidos** do JSON (`@JsonInclude(NON_NULL)`) | `403` | `403` |
| `CLAI_PSICOPEDAGOGO` (`RESTRICAO_MODERADA`) | Presentes | `200` | `200` |
| `COORDENADOR`, `ADMIN` (`SUPER_RESTRICAO`) | Presentes | `200` | `200` |

- `RbacGuard.temRestricaoModeradaOuSuperior()` é `true` se o nível for `RESTRICAO_MODERADA`/`SUPER_RESTRICAO` **ou** a role for `CLAI_PSICOPEDAGOGO`/`COORDENADOR`/`ADMIN` (e o acesso estiver ativo). É usado em `@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")` e na projeção de dados nos mappers/services.
- **Download de anexo sensível (TA11.2):** exige `nivelRestricao = SUPER_RESTRICAO` **e** `autorizacaoSaude = true` (conferido em `AnexoEstudanteService`). Nos dados de seed, só o `ADMIN` atende a ambos.
- As demais rotas não possuem `@PreAuthorize`: basta estar autenticado (ver coluna "Roles" nas tabelas da seção 4).

#### 2.2 Soft Delete e Inativação Lógica

- **Soft Delete de Entidades do Domínio (`@SoftDelete`):** `BaseEntity` (`@MappedSuperclass`) é anotada com `@SoftDelete` do Hibernate: as entidades herdam a coluna `deleted BOOLEAN NOT NULL DEFAULT FALSE`. O `repository.delete(entidade)` vira `UPDATE ... SET deleted = true`; o registro permanece fisicamente no banco, mas consultas JPA ignoram automaticamente os excluídos.
- **Inativação Lógica de Negócio em Aluno (US 12):** O endpoint `DELETE /api/alunos/{id}` **não** chama `repository.delete()`, para que a coluna `deleted` não esconda o aluno das consultas e não quebre a integridade histórica dos Estudos de Caso, PEIs, PEAs e Prontuários vinculados. Em vez disso, altera `ativo = false`, define `status = INATIVO` (ou `EVADIDO` se informado via parâmetro) e atualiza `atualizadoPor` e `atualizadoEm` (`204 No Content`).
- **Rotas DELETE:**
  - `DELETE /api/alunos/{id}`: inativação lógica de negócio (`ativo = false`, `204 No Content`).
  - `DELETE /api/estudos-de-caso/{id}`: soft delete via Hibernate (somente status `RASCUNHO`, `204 No Content`).
  - `DELETE /api/peis/{id}` e `DELETE /api/peas/{id}`: soft delete via Hibernate (`204 No Content`).

#### 2.3 Regras de domínio relevantes

**Gestão de Alunos (US 12)** (`AlunoService` + `AlunoRepository`)

- **Cadastro e atualização (`POST /api/alunos`, `PUT /api/alunos/{id}`):** Exigem `nomeCompleto`, `matricula`, `curso`, `turma`, `status` (`StatusAluno`) e ao menos uma tag em `tagsDificuldadeIds`.
- **Unicidade de matrícula:** A tentativa de cadastrar ou alterar para uma matrícula já pertencente a outro aluno dispara `ConflitoException` (`409 Conflict`).
- **Invariante de status e ativação:** Status `INATIVO` e `EVADIDO` definem automaticamente `ativo = false`. Status `ATIVO` e `EM_TRIAGEM` definem `ativo = true`.
- **Tags de acessibilidade e dificuldade:** Relacionamento N:M com `IndicadorReutilizavel` via `sigi.aluno_tag_dificuldade`. Se qualquer tag informada em `tagsDificuldadeIds` não for encontrada, lança `400 Bad Request` (`RegraDeNegocioException`).
- **Busca paginada com filtros combinados (`GET /api/alunos`):** Suporta `termo` (pesquisa parcial insensível a maiúsculas em nome ou matrícula), `curso`, `turma`, `tag` (ou `tagAcessibilidade`), `ativo` (padrão `true`) e paginação Spring Data (`page`, `size`, `sort`).
- **Inativação lógica de negócio:** `DELETE /api/alunos/{id}` aceita opcionalmente `?status=EVADIDO` (padrão: `INATIVO`), garantindo que o histórico do prontuário, PEIs e PEAs permaneça íntegro.

**Catálogo de Indicadores e Tags** (`IndicadorReutilizavelService`)

- `GET /api/indicadores`: Devolve a lista de tags ativas no sistema (`id`, `nome`, `descricao`) para popular seletores e filtros na interface gráfica.

**Estudo de Caso** (`EstudoDeCasoService` + `EstudoDeCasoValidator`)

- Status: `RASCUNHO`, `ATIVO`, `ENCERRADO` (obrigatório na requisição).
- **TA2.3:** status `ENCERRADO` exige `diagnosticoInicial` não vazio **e** ao menos 1 indicador (`indicadoresIds`) → `400`. `RASCUNHO`/`ATIVO` aceitam campos vazios.
- **TA2.4:** só pode existir **1 estudo `ATIVO` por aluno** (checado no service e garantido por índice único parcial no banco).
- Estudo `ATIVO`/`ENCERRADO` **não pode voltar para `RASCUNHO`** e **não pode ser excluído**; apenas rascunhos são descartáveis.
- Aluno inexistente na criação → `400` (`RegraDeNegocioException`); indicadores inexistentes → `400`.
- **Dados sensíveis:** `historicoFamiliar` e `historicoSocioemocional` são gravados normalmente, mas **só aparecem na resposta** para `RESTRICAO_MODERADA` ou superior. No `PUT`, `status`/`diagnosticoInicial`/`indicadoresIds` (se enviado) são substituídos; os históricos só são alterados se enviados (não nulos).
- **TA2.2:** `criadoPor`/`atualizadoPor` gravados a partir do usuário do token.

**PEI / PEA** (`PeiService`, `PeaService`)

- Ambos pertencem a um **`Acompanhamento`** (ponte Aluno ↔ planos). Não há endpoint REST para criar `Acompanhamento`: ele é criado por seed/SQL. `acompanhamentoId` inexistente → `404`.
- `PUT` é **parcial**: campos `null` são ignorados.
- `PeaResponseDTO.alunoId` é derivado do acompanhamento; `disciplinaId` é opcional.
- **TA3.2:** `GET /api/peis/{id}/anexos-sensiveis` devolve os PEAs do acompanhamento do PEI, restrito a `RESTRICAO_MODERADA`+ (`403` para `PROFESSOR`).
- **TA3.4:** `DELETE` é soft delete com trilha de auditoria.
- `PlanoAcao` existe no domínio/banco, mas **não possui controller**.

**Anexos do Estudante** (`AnexoEstudanteService`, `CryptoStorageService`)

| `TipoClassificacaoAnexo` | Sensível | Armazenamento |
| :--- | :---: | :--- |
| `LAUDO_MEDICO` | Sim | Cifrado **AES/GCM/NoPadding**, chave 256 bits, IV aleatório de 12 bytes (Base64 em `iv`), tag 128 bits; arquivo salvo com sufixo `.enc` |
| `DIAGNOSTICO_NEUROPSICOLOGICO` | Sim | Idem |
| `DOCUMENTO_PEDAGOGICO` | Não | Gravado em claro |

- Arquivos ficam em `ATTACHMENTS_STORAGE_PATH/{alunoId}/{uuid}_{nome}`; nome sanitizado (`[^a-zA-Z0-9._-]` → `_`); proteção contra *path traversal*.
- O download decifra **somente em memória** (nenhum arquivo temporário) e responde com `Content-Disposition: attachment` e `Cache-Control: no-store`.
- A listagem devolve apenas metadados (nunca caminho físico nem IV).
- Documento **não sensível**: qualquer usuário autenticado pode baixar.
- A chave `AES_KEY` deve ter exatamente **32 bytes** (32 caracteres ou 64 hex), senão a aplicação não sobe.

**Prontuário e Timeline**

- `GET /api/alunos/{id}/prontuario`: usa o estudo `ATIVO` (ou o último, se não houver ativo) e retorna `totalPeis`, `totalPeas`, `totalAnexos`; históricos sensíveis só para `RESTRICAO_MODERADA`+.
- `GET /api/alunos/{alunoId}/timeline`: agrega eventos `ESTUDO_DE_CASO`, `PEI` e `PEA` (`id`, `tipo`, `dataCriacao`), ordenados por `dataCriacao` **crescente** (desempate por `id`). Registros excluídos logicamente não aparecem. Aluno sem registros retorna `[]`.

---

## 3. Como Configurar e Executar o Projeto Localmente

### Pré-requisitos

- **JDK 21**
- **Docker + Docker Compose** (Opção A) **ou** PostgreSQL 14+ instalado (Opção B)
- Maven (ou use o wrapper `mvnw` / `mvnw.cmd` em `app/backend`)

### Perfis de Execução (`application.yaml`, `application-dev.yaml`, `application-prd.yaml`)

O back-end possui segregação formal de configurações em perfis do Spring Boot:
- **`dev` (padrão):** Ativado por padrão (`SPRING_PROFILES_ACTIVE=dev`). Habilita logs detalhados, exibição de SQL formatado (`show-sql: true`) e credenciais padrão para desenvolvimento local.
- **`prd`:** Desativa logs verbosos e formatação de SQL (`show-sql: false`), e exige obrigatoriamente a definição de `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET` e `AES_KEY` sem valores padrão inseguros.

### Credenciais e variáveis de ambiente

| Variável | Padrão (dev) | Uso |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil ativo do Spring Boot (`dev` ou `prd`) |
| `POSTGRES_DB` | `sigi_clai` | Nome do banco de dados |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `postgres` / `postgres` | Credenciais do PostgreSQL (container ou local) |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | Host e porta do banco |
| `DB_SCHEMA` | `sigi` | Schema padrão do Hibernate (`default_schema`) |
| `SPRING_DATASOURCE_URL` | derivado (`jdbc:postgresql://${DB_HOST}:${DB_PORT}/${POSTGRES_DB}`) | URL JDBC de conexão |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | derivados de `POSTGRES_USER` / `_PASSWORD` | Credenciais lidas pelo Spring Boot |
| `SERVER_PORT` | `8080` | Porta HTTP da API |
| `JWT_SECRET` | `sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod` | Chave HMAC-SHA256 do JWT (mínimo de 256 bits / 32 bytes) |
| `AES_KEY` | `0123456789abcdef0123456789abcdef` | Chave AES-256 para anexos sensíveis (**trocar em produção**) |
| `ATTACHMENTS_STORAGE_PATH` | `/app/storage/anexos` (container) / `./storage/anexos` (local) | Diretório físico dos anexos |

> [!WARNING]
> `JWT_SECRET` e `AES_KEY` padrão servem **exclusivamente para desenvolvimento**. Trocar a `AES_KEY` torna ilegíveis os anexos previamente criptografados.

> [!NOTE]
> O projeto utiliza `open-in-view: false` (OSIV desativado), `ddl-auto: validate` e **Flyway** (`enabled: true`): **o schema e as tabelas são versionados e aplicados automaticamente na inicialização do backend** (`src/main/resources/db/migration/`). Em seguida, o Hibernate valida todas as entidades contra o banco real antes de liberar a API.

### Opção A — Via Docker (Recomendado)

O projeto dispõe de configurações modulares de Docker Compose na raiz:

```bash
# 1. (opcional) Copie o modelo de variáveis
cp .env.example .env            # PowerShell: Copy-Item .env.example .env

# 2. Subir o ambiente de desenvolvimento completo (banco + backend + frontend)
docker compose -f docker-compose.dev.yml up -d --build

# Ou, se desejar subir apenas o banco de dados de desenvolvimento:
docker compose -f docker-compose.dev.yml up -d db
```

> [!TIP]
> - **Desenvolvimento (`dev`):** O [`docker-compose.dev.yml`](../../docker-compose.dev.yml) sobe `sigi-db-dev`, `sigi-backend-dev` e `sigi-frontend-dev`. Ao subir o backend, o **Flyway** aplica `classpath:db/migration` (DDL) e `classpath:db/seed/dev` (dados iniciais de teste).
> - **Produção (`prd`):** O [`docker-compose.prd.yml`](../../docker-compose.prd.yml) isola o ambiente com portas restritas, exige segredos obrigatórios e configura o Flyway para executar **apenas** `classpath:db/migration` (sem dados fictícios/seeds de teste e com `clean-disabled: true`).

Migrations versionadas executadas automaticamente pelo Flyway:

| Script | Pasta | Perfis | Função |
| :--- | :--- | :---: | :--- |
| `V1__create_initial_schema.sql` | `db/migration/` | `dev`, `prd` | Schema `sigi` + 11 tabelas principais |
| `V2__constraints_indexes_and_comments.sql` | `db/migration/` | `dev`, `prd` | Índice parcial único (`idx_estudo_caso_ativo`), índices e comentários LGPD |
| `R__01_seed_us11_rbac.sql` | `db/seed/dev/` | `dev` | 5 usuários RBAC de desenvolvimento (senha `senha123`) |
| `R__02_seed_us02_estudo_caso.sql` | `db/seed/dev/` | `dev` | 2 alunos base + tags US 12 + 3 indicadores |
| `R__03_seed_us03_planejamento_pedagogico.sql` | `db/seed/dev/` | `dev` | 2 acompanhamentos base |

> [!IMPORTANT]
> Caso um volume PostgreSQL local tenha sido criado anteriormente sem o Flyway (antes da adoção de `flyway_schema_history`), recrie o volume limpo para que o Flyway assuma o histórico desde a `V1`: `docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up -d --build`.

Verificação rápida do histórico Flyway e usuários em desenvolvimento:
```bash
docker exec -it sigi-db-dev psql -U postgres -d sigi_clai -c "SELECT installed_rank, version, description, success FROM sigi.flyway_schema_history;"
docker exec -it sigi-db-dev psql -U postgres -d sigi_clai -c "SELECT email, role FROM sigi.usuario;"
```

### Opção B — PostgreSQL Nativo / Clientes Externos (DBeaver, pgAdmin)

1. **Parâmetros de Conexão:**

   | Parâmetro | Valor |
   | :--- | :--- |
   | Host | `localhost` |
   | Porta | `5432` |
   | Banco | `sigi_clai` |
   | Usuário / Senha | `postgres` / `postgres` |
   | Schema | `sigi` |

2. Crie apenas o banco vazio (caso não exista):
   ```sql
   CREATE DATABASE sigi_clai;
   ```
3. Ao iniciar o backend (`./mvnw spring-boot:run`), o **Flyway** criará automaticamente o schema `sigi`, as tabelas, índices e (no perfil `dev`) os seeds de desenvolvimento, validados na sequência por `ddl-auto: validate`.

### Executando a aplicação Spring Boot localmente

```bash
cd app/backend

# Configurar diretório de armazenamento local de anexos fora do container
export ATTACHMENTS_STORAGE_PATH=./storage/anexos     # PowerShell: $env:ATTACHMENTS_STORAGE_PATH="./storage/anexos"

# Compilar e executar
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

- A API subirá em `http://localhost:8080`.
- Health check: `GET http://localhost:8080/actuator/health`.
- Documentação OpenAPI / Swagger UI: `http://localhost:8080/swagger-ui.html`.
- Limite de upload: vale o padrão do Spring Boot (**1 MB por arquivo**).

---

## 4. Catálogo de Endpoints da API

**Convenções**

- Todas as rotas exigem `Authorization: Bearer <token>`, exceto as marcadas como **Pública**.
- "Autenticado" = qualquer usuário ativo com token válido.
- Sucesso: `200 OK` (consulta/atualização), `201 Created` (criação), `204 No Content` (exclusão).
- Erros: ver [seção 5](#5-tratamento-de-erros-e-exceções-handler-e-exception). Todos os IDs são `UUID`.
- O ID do usuário auditor é obtido do token (não é enviado no corpo nem em header).

### 4.1 Autenticação e Administração de Acesso (RBAC)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autentica e emite o JWT | **Pública** | Body `LoginRequestDTO` | `200` · `LoginResponseDTO` |
| `GET` | `/api/auth/me` | Dados da sessão atual e authorities | Autenticado | — | `200` · `UsuarioSessaoDTO` |
| `PATCH` | `/api/admin/usuarios/{id}/revogar-acesso` | Revoga acesso e invalida todos os tokens do usuário (TA11.4) | `ADMIN` | Path `id` | `200` · `UsuarioRevogadoResponseDTO` |

**DTOs**

- **`LoginRequestDTO`** — `email` *String* `@NotBlank` `@Email`; `senha` *String* `@NotBlank`.
- **`LoginResponseDTO`** — `token` *String*; `tipoToken` *String* (`"Bearer"`); `userId` *UUID*; `nome`; `email`; `role` *Role*; `nivelRestricao` *NivelRestricao*; `autorizacaoSaude` *Boolean*; `tokenVersion` *Integer*.
- **`UsuarioSessaoDTO`** — `id`; `nome`; `email`; `role`; `nivelRestricao`; `autorizacaoSaude`; `acessoAtivo` *Boolean*; `tokenVersion`; `authorities` *List\<String\>* (ex.: `ROLE_ADMIN`, `REST_SUPER_RESTRICAO`, `AUTH_SAUDE`).
- **`UsuarioRevogadoResponseDTO`** — `id`; `email`; `nome`; `acessoAtivo` *Boolean* (`false`); `tokenVersion` *Integer* (incrementado); `mensagem` *String*.

### 4.2 Gestão de Alunos (`/api/alunos`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/alunos` | Cadastra novo estudante vinculado a tags | Autenticado | Body `AlunoRequestDTO` | `201` · `AlunoResponseDTO` |
| `GET` | `/api/alunos/{id}` | Busca estudante cadastrado por ID | Autenticado | Path `id` | `200` · `AlunoResponseDTO` |
| `GET` | `/api/alunos` | Consulta paginada com filtros combinados | Autenticado | Query: `termo`, `curso`, `turma`, `tag`/`tagAcessibilidade`, `ativo`, `page`, `size`, `sort` | `200` · `Page<AlunoResponseDTO>` |
| `PUT` | `/api/alunos/{id}` | Atualiza dados e tags do estudante | Autenticado | Path `id` + Body `AlunoRequestDTO` | `200` · `AlunoResponseDTO` |
| `DELETE` | `/api/alunos/{id}` | Inativação lógica (`ativo = false`) | Autenticado | Path `id` + Query opcional `status` (`INATIVO` ou `EVADIDO`) | `204` · sem corpo |

**DTOs**

- **`AlunoRequestDTO`** — `nomeCompleto` *String* `@NotBlank` `@Size(max = 255)`; `matricula` *String* `@NotBlank` `@Size(max = 50)`; `curso` *String* `@NotBlank` `@Size(max = 100)`; `turma` *String* `@NotBlank` `@Size(max = 50)`; `status` *StatusAluno* `@NotNull`; `tagsDificuldadeIds` *List<UUID>* `@NotEmpty`.
- **`AlunoResponseDTO`** — `id` *UUID*; `nomeCompleto` *String*; `matricula` *String*; `curso` *String*; `turma` *String*; `status` *StatusAluno*; `ativo` *Boolean*; `tagsDificuldade` *List<String>*; `tagsDificuldadeIds` *List<UUID>*; `criadoEm`, `atualizadoEm` *LocalDateTime*.

### 4.3 Catálogo de Indicadores e Tags (`/api/indicadores`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/indicadores` | Catálogo de tags reutilizáveis ativas | Autenticado | — | `200` · `List<IndicadorResposta>` |

**DTO**

- **`IndicadorResposta`** — `id` *UUID*; `nome` *String*; `descricao` *String*.

### 4.4 Estudo de Caso (`/api/estudos-de-caso`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/estudos-de-caso/{id}` | Busca um estudo de caso | Autenticado¹ | Path `id` | `200` · `EstudoDeCasoResponseDTO` |
| `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | Lista estudos de um aluno | Autenticado¹ | Path `alunoId` | `200` · `List<EstudoDeCasoResponseDTO>` |
| `POST` | `/api/estudos-de-caso` | Cria estudo (`RASCUNHO`, `ATIVO` ou `ENCERRADO`) | Autenticado | Body `EstudoDeCasoRequestDTO` | `201` · `EstudoDeCasoResponseDTO` |
| `PUT` | `/api/estudos-de-caso/{id}` | Atualiza/conclui estudo | Autenticado | Path `id` + Body `EstudoDeCasoUpdateDTO` | `200` · `EstudoDeCasoResponseDTO` |
| `DELETE` | `/api/estudos-de-caso/{id}` | Descarta rascunho (soft delete) | Autenticado | Path `id` | `204` · sem corpo |

¹ Campos sensíveis (`historicoFamiliar`, `historicoSocioemocional`) só retornam para `RESTRICAO_MODERADA`+; para `PROFESSOR`/`ALUNO_APOIADOR` as chaves são omitidas.

**DTOs**

- **`EstudoDeCasoRequestDTO`** — `alunoId` *UUID* `@NotNull`; `status` *StatusEstudoCaso* `@NotNull`; `diagnosticoInicial` *String* (obrigatório se `ENCERRADO`); `historicoFamiliar` *String*; `historicoSocioemocional` *String*; `indicadoresIds` *List\<UUID\>* (≥ 1 se `ENCERRADO`).
- **`EstudoDeCasoUpdateDTO`** — igual ao anterior, **sem `alunoId`**; `status` `@NotNull`.
- **`EstudoDeCasoResponseDTO`** (`NON_NULL`) — `id`; `alunoId`; `status`; `diagnosticoInicial`; `historicoFamiliar`\*; `historicoSocioemocional`\*; `indicadoresIds` *List\<UUID\>*; `criadoEm`, `atualizadoEm` *LocalDateTime* (\* omitidos sem permissão).

### 4.5 Prontuário Unificado (`/api/alunos`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/alunos/{estudanteId}/prontuario` | Prontuário consolidado do estudante (TA11.3) | Autenticado¹ | Path `estudanteId` | `200` · `ProntuarioResponseDTO` |
| `GET` | `/api/alunos/{estudanteId}/historico-socioemocional` | Histórico familiar e socioemocional completo | `RESTRICAO_MODERADA`+ (`@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")`) | Path `estudanteId` | `200` · `HistoricoSocioemocionalResponseDTO` |

¹ Projeção condicional dos campos sensíveis.

**DTOs**

- **`ProntuarioResponseDTO`** (`NON_NULL`) — `alunoId`; `nomeAluno`; `matricula`; `estudoDeCasoId`; `statusEstudoDeCaso`; `diagnosticoInicial`; `historicoFamiliar`\*; `historicoSocioemocional`\*; `totalPeis`, `totalPeas`, `totalAnexos` *int*; `atualizadoEm`.
- **`HistoricoSocioemocionalResponseDTO`** — `alunoId`; `nomeAluno`; `matricula`; `estudoDeCasoId`; `historicoFamiliar`; `historicoSocioemocional`; `atualizadoEm`.

### 4.6 Planejamento Pedagógico — PEI (`/api/peis`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/peis` | Lista todos os PEIs ativos | Autenticado | — | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/{id}` | Busca PEI por ID | Autenticado | Path `id` | `200` · `PeiResponseDTO` |
| `GET` | `/api/peis/acompanhamento/{acompanhamentoId}` | PEIs de um acompanhamento | Autenticado | Path | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/aluno/{alunoId}` | PEIs de um aluno | Autenticado | Path | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/{id}/anexos-sensiveis` | PEAs anexados ao PEI (TA3.2) | `RESTRICAO_MODERADA`+ (`@PreAuthorize`) | Path `id` | `200` · `List<PeaResponseDTO>` |
| `POST` | `/api/peis` | Cria PEI (TA3.1) | Autenticado | Body `PeiRequestDTO` | `201` · `PeiResponseDTO` |
| `PUT` | `/api/peis/{id}` | Atualização parcial do PEI | Autenticado | Path + Body `PeiUpdateDTO` | `200` · `PeiResponseDTO` |
| `DELETE` | `/api/peis/{id}` | Inativa o PEI (soft delete — TA3.4) | Autenticado | Path `id` | `204` · sem corpo |

### 4.7 Planejamento Pedagógico — PEA (`/api/peas`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/peas` | Lista todos os PEAs ativos | Autenticado | — | `200` · `List<PeaResponseDTO>` |
| `GET` | `/api/peas/{id}` | Busca PEA por ID | Autenticado | Path `id` | `200` · `PeaResponseDTO` |
| `GET` | `/api/peas/acompanhamento/{acompanhamentoId}` | PEAs de um acompanhamento | Autenticado | Path | `200` · `List<PeaResponseDTO>` |
| `GET` | `/api/peas/aluno/{alunoId}` | PEAs de um aluno | Autenticado | Path | `200` · `List<PeaResponseDTO>` |
| `POST` | `/api/peas` | Cria PEA | Autenticado | Body `PeaRequestDTO` | `201` · `PeaResponseDTO` |
| `PUT` | `/api/peas/{id}` | Atualização parcial do PEA | Autenticado | Path + Body `PeaUpdateDTO` | `200` · `PeaResponseDTO` |
| `DELETE` | `/api/peas/{id}` | Exclusão lógica do PEA | Autenticado | Path `id` | `204` · sem corpo |

**DTOs (PEI e PEA)**

- **`PeiRequestDTO`** — `acompanhamentoId` *UUID* `@NotNull`; `habilidadesInteresses` *String* `@NotBlank`; `propostasAdaptacoes` *String* `@NotBlank`.
- **`PeiUpdateDTO`** — `habilidadesInteresses`, `propostasAdaptacoes` *String* (sem validação; `null` = não altera).
- **`PeiResponseDTO`** — `id`; `acompanhamentoId`; `alunoId`; `habilidadesInteresses`; `propostasAdaptacoes`; `criadoEm`; `atualizadoEm`.
- **`PeaRequestDTO`** — `acompanhamentoId` *UUID* `@NotNull`; `disciplinaId` *UUID* (opcional); `objetivoGeral` *String* `@NotBlank`; `metodologia` *String* `@NotBlank`; `avaliacao` *String* `@NotBlank`.
- **`PeaUpdateDTO`** — `disciplinaId` *UUID*, `objetivoGeral`, `metodologia`, `avaliacao` *String* (sem validação; `null` = não altera).
- **`PeaResponseDTO`** — `id`; `acompanhamentoId`; `alunoId`; `disciplinaId`; `objetivoGeral`; `metodologia`; `avaliacao`; `criadoEm`; `atualizadoEm`.

### 4.8 Anexos do Estudante (`/api`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/alunos/{id}/anexos` | Upload de anexo (cifra laudos/diagnósticos — TA11.1) | Autenticado | Path `id` + `multipart/form-data`: `arquivo` (ou `file`) *MultipartFile*, `classificacao` *TipoClassificacaoAnexo* | `201` · `AnexoEstudanteResponseDTO` |
| `GET` | `/api/alunos/{id}/anexos` | Lista metadados dos anexos do estudante | Autenticado | Path `id` | `200` · `List<AnexoEstudanteResponseDTO>` |
| `GET` | `/api/anexos/{anexoId}/download` | Baixa o arquivo (decifra em memória — TA11.2) | Anexo sensível: `SUPER_RESTRICAO` **+** `autorizacaoSaude=true`. Não sensível: Autenticado | Path `anexoId` | `200` · bytes (`Content-Type` original, `Content-Disposition: attachment`) |

**DTO**

- **`AnexoEstudanteResponseDTO`** — `id`; `alunoId`; `nomeOriginal`; `contentType`; `tamanhoBytes` *Long*; `classificacao` *LAUDO_MEDICO \| DIAGNOSTICO_NEUROPSICOLOGICO \| DOCUMENTO_PEDAGOGICO*; `criptografado` *Boolean*; `criadoEm`.
- Parâmetros do upload: `classificacao` é obrigatória (`400` se ausente/inválida); arquivo vazio/ausente → `400`.

### 4.9 Timeline (`/api/alunos`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/alunos/{alunoId}/timeline` | Eventos do aluno em ordem cronológica (TA9.2) | Autenticado | Path `alunoId` | `200` · `List<TimelineEventDTO>` |

**DTO**

- **`TimelineEventDTO`** — `id` *UUID*; `tipo` *String* (`ESTUDO_DE_CASO` \| `PEI` \| `PEA`); `dataCriacao` *LocalDateTime*.

### 4.10 Monitoramento e Documentação

| Método | Rota | Descrição | Roles | Sucesso |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | Health check da aplicação | **Pública** | `200` |
| `GET` | `/swagger-ui.html` | Interface Swagger UI para exploração interativa da API | **Pública** | `200` / `302` |
| `GET` | `/v3/api-docs` | Especificação OpenAPI 3 em formato JSON | **Pública** | `200` |

---

## 5. Tratamento de Erros e Exceções (`handler` e `exception`)

O [`GlobalExceptionHandler`](src/main/java/com/br/CLAI/handler/GlobalExceptionHandler.java) (`@RestControllerAdvice`) responde sempre com **RFC 9457 `ProblemDetail`** (`application/problem+json`), acrescido do campo `timestamp` (ISO-8601, UTC). O Spring adiciona `instance` com o caminho da requisição.

```json
{
  "type": "https://api.sigi.com/errors/nao-encontrado",
  "title": "Recurso Não Encontrado",
  "status": 404,
  "detail": "Estudo de Caso não encontrado com o ID fornecido.",
  "instance": "/api/estudos-de-caso/00000000-0000-0000-0000-000000000000",
  "timestamp": "2026-10-27T16:30:00.123456Z"
}
```

### Erros mapeados

| Exceção (`com.br.CLAI.exception` ou Spring) | Status HTTP | Título / `type` (`https://api.sigi.com/errors/...`) | Cenário em que ocorre na API |
| :--- | :---: | :--- | :--- |
| `NaoEncontradoException` | **404** | `Recurso Não Encontrado` · `nao-encontrado` | Estudo de Caso, PEA, PEI, Acompanhamento, Estudante, Anexo ou Usuário inexistente (ou excluído logicamente); `GET /estudos-de-caso/aluno/{id}` com aluno inexistente; `GET /prontuario` e anexos com estudante inexistente. |
| `ConflitoException` | **409** | `Conflito de Dados` · `conflito` | Matrícula duplicada ao cadastrar (`POST /api/alunos`) ou atualizar (`PUT /api/alunos/{id}`) um aluno (*"Já existe um aluno cadastrado com a matrícula informada."*). |
| `RegraDeNegocioException` | **400** | `Erro de Regra de Negócio` · `regra-de-negocio` | Estudo `ENCERRADO` sem diagnóstico ou sem indicador; 2º estudo `ATIVO` para o mesmo aluno; tag inexistente em cadastro de aluno; aluno ou indicador inexistente na criação de estudo; reverter estudo concluído para `RASCUNHO`; excluir estudo `ATIVO`/`ENCERRADO`; status inválido na inativação de aluno; upload sem arquivo ou sem classificação; arquivo físico do anexo ausente no volume; falha de I/O no armazenamento. |
| `AcessoNegadoException` | **403** | `Acesso Negado` · `acesso-negado` | Download de anexo sensível sem `SUPER_RESTRICAO` + `autorizacaoSaude`; download sem usuário autenticado resolvido. |
| `AccessDeniedException` (Spring Security, `@PreAuthorize`) | **403** | `Acesso Negado` · `acesso-negado` | `PROFESSOR`/`ALUNO_APOIADOR` em `/historico-socioemocional` ou `/peis/{id}/anexos-sensiveis`; não-`ADMIN` em `/admin/**` com método protegido. Mensagem padrão: *"Seu perfil não possui permissão para acessar este recurso."* |
| `DisabledException` / `LockedException` | **401** | `Sessão Revogada` · `sessao-revogada` | Login de usuário com `acesso_ativo = false`; uso do principal revogado. |
| `AuthenticationCredentialsNotFoundException` / `InsufficientAuthenticationException` | **401** | `Não Autorizado` · `nao-autorizado` | Operação de escrita sem usuário identificado no contexto de segurança. |
| `AuthenticationException` (demais, ex.: `BadCredentialsException`) | **401** | `Falha na Autenticação` · `falha-autenticacao` | Login com e-mail/senha incorretos (*"Credenciais inválidas: e-mail ou senha incorretos."*). |
| `MethodArgumentNotValidException` | **400** | `Erro de Validação de Campos` · `validacao` | Falha de Bean Validation em `@Valid @RequestBody` (ver abaixo). |

### Validação (`MethodArgumentNotValidException` → `400 Bad Request`)

O `detail` concatena `campo: mensagem` de cada violação, separados por vírgula:

```json
{
  "type": "https://api.sigi.com/errors/validacao",
  "title": "Erro de Validação de Campos",
  "status": 400,
  "detail": "objetivoGeral: O objetivo geral é obrigatório, metodologia: A metodologia é obrigatória",
  "instance": "/api/peas",
  "timestamp": "2026-10-27T16:30:00.123456Z"
}
```

Exemplos de mensagens: `alunoId: O ID do aluno é obrigatório`, `matricula: A matrícula é obrigatória`, `nomeCompleto: O nome completo é obrigatório`, `status: O status do estudo de caso é obrigatório`, `email: Formato de e-mail inválido`, `senha: A senha é obrigatória`, `acompanhamentoId: O ID do acompanhamento é obrigatório`.

### Erros de segurança (`401` / `403`)

Gerados no fluxo de autenticação e autorização (OAuth2 Resource Server / Spring Security), padronizados em `application/problem+json`:

| Origem | Status | `detail` |
| :--- | :---: | :--- |
| `AuthenticationEntryPoint` (sem header `Authorization`) | **401** `Não Autorizado` | `Autenticação obrigatória para acessar este recurso.` |
| `NimbusJwtDecoder` — token malformado ou expirado | **401** | `Token JWT inválido ou expirado.` |
| `OAuth2TokenValidator` (`sessionValidator`) — usuário associado não encontrado | **401** | `Usuário associado ao token não encontrado.` |
| `OAuth2TokenValidator` (`sessionValidator`) — `acesso_ativo = false` | **401** | `Acesso revogado: o vínculo do usuário está desativado.` |
| `OAuth2TokenValidator` (`sessionValidator`) — `tokenVersion` divergente (após revogação) | **401** | `Sessão revogada ou versão do token inválida.` |
| `AccessDeniedHandler` (ex.: não-`ADMIN` em `/api/admin/**`) | **403** `Acesso Negado` | `Seu perfil não possui permissão para acessar este recurso.` |

> [!NOTE]
> **Não mapeados explicitamente** (sem handler customizado, portanto sem o formato `ProblemDetail` do projeto): JSON malformado ou valor de enum inválido no corpo, UUID inválido no path, parte multipart ausente, upload acima de 1 MB (limite padrão do Spring) e falhas internas de criptografia (`SecurityException`/`IllegalArgumentException` em `CryptoStorageService`, ex.: adulteração do arquivo cifrado), que resultam no tratamento padrão do Spring (4xx/5xx).

---

## 6. Como Testar a API no Postman (`collection/`)

As coleções ficam em [`app/backend/collection/`](collection) (formato Postman Collection v2.1).

### Passo a passo

1. Suba o banco **com os seeds** (seção 3) e a API (`mvn spring-boot:run`) em `http://localhost:8080`.
2. No Postman: **Import** → selecione o par `.postman_collection.json` + `.postman_environment.json` da pasta desejada.
3. Escolha o ambiente correspondente (canto superior direito) e rode as requisições na ordem numérica, ou **Run Collection**.
4. Via terminal (Newman), a partir de `app/backend`:
   ```bash
   npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json -e collection/US03/SIGI_Environment.postman_environment.json
   ```

### Coleção × seed necessário

| Pasta | Arquivos | Ambiente Postman | Cobertura | Seed automático em `dev` (`db/seed/dev/`) |
| :--- | :--- | :--- | :--- | :--- |
| `collection/US02` | `SIGI_EstudoDeCaso.postman_collection.json` + `SIGI_Environment.postman_environment.json` | `SIGI - Localhost Environment` | CRUD de Estudo de Caso (TA2.2/2.3/2.4, soft delete) | `R__02_seed_us02_estudo_caso.sql` (alunos `1111…`/`2222…` e indicadores `aaaa…`/`bbbb…`/`cccc…`) + `R__01_seed_us11_rbac.sql` (usuários, necessários para obter o JWT) |
| `collection/US03` | `SIGI_PlanejamentoPedagogico.postman_collection.json` + `SIGI_Environment.postman_environment.json` | `SIGI - US03 Environment` | PEA e PEI (TA3.1/3.2/3.4) | `R__03_seed_us03_planejamento_pedagogico.sql` (acompanhamentos `3333…`/`4444…`) + `R__01_seed_us11_rbac.sql` |
| `collection/US11` | `SIGI_US11_Autenticacao_RBAC.postman_collection.json` + `SIGI_US11_Environment.postman_environment.json` | `SIGI - US11 Environment` | Login/JWT, RBAC, revogação (TA11.4), anexos AES-256 (TA11.1/11.2), matriz granular (TA11.3/TA3.2) | `R__01_seed_us11_rbac.sql` + `R__02_seed_us02_estudo_caso.sql` (estudante `1111…`); recomendado também `R__03_seed_us03_planejamento_pedagogico.sql` |

No perfil `dev`, o Flyway executa automaticamente os três seeds na ordem alfabética (atendendo todas as coleções). A coleção **US11** inclui scripts PowerShell auxiliares (`test_matriz_granular.ps1`, `test_criptografia_anexos.ps1`, `test_revogacao_sessao.ps1`) e faz o login de cada perfil, salvando os tokens em variáveis do ambiente (`tokenAdmin`, `tokenProfessor`, `tokenPsicopedagogo`, `tokenCoordenador`, `tokenAluno`).

### Usuários de seed (senha `senha123` para todos)

| E-mail | Role | Nível | `autorizacaoSaude` |
| :--- | :--- | :--- | :---: |
| `admin@sigi.ifpb.edu.br` | `ADMIN` | `SUPER_RESTRICAO` | ✅ |
| `coordenador@sigi.ifpb.edu.br` | `COORDENADOR` | `SUPER_RESTRICAO` | ❌ |
| `psicopedagogo@sigi.ifpb.edu.br` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | ✅ |
| `professor@sigi.ifpb.edu.br` | `PROFESSOR` | `ACESSO_FUNCIONAL` | ❌ |
| `aluno.apoiador@sigi.ifpb.edu.br` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | ❌ |

IDs fixos de seed: alunos `11111111-1111-1111-1111-111111111111` (`MAT-TEST-001`) e `22222222-2222-2222-2222-222222222222` (`MAT-TEST-002`); acompanhamentos `33333333-…` (aluno 1) e `44444444-…` (aluno 2).

> [!WARNING]
> **As coleções US02 e US03 estão desatualizadas em relação à segurança atual.** Elas enviam o header `X-User-Id` (ignorado pelo back-end) e **não possuem login/`Authorization`**; como `anyRequest().authenticated()` está ativo, suas requisições recebem `401`. Para executá-las: faça `POST /api/auth/login` (ex.: `psicopedagogo@sigi.ifpb.edu.br`) e configure a aba **Authorization → Bearer Token** na coleção com o `token` retornado. Use um perfil `RESTRICAO_MODERADA`+ para enxergar os campos sensíveis do Estudo de Caso. Além disso, os comandos Newman do `README.md` da US02 usam caminhos sem a subpasta `US02/`.

---

## Licença

Projeto acadêmico e institucional vinculado ao **Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB)**.
