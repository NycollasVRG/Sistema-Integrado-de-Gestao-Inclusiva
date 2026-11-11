# SIGI / CLAI — Sistema Integrado de Gestão Inclusiva

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring_Security-OAuth2_Resource_Server-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)](https://spring.io/projects/spring-security)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange?style=for-the-badge)](#)

---

## 1. Sobre

O **SIGI / CLAI (Sistema Integrado de Gestão Inclusiva)** é uma solução tecnológica desenvolvida para atender às demandas de gestão pedagógica, documental, cadastral e assistencial no âmbito da **Coordenação Local de Acessibilidade e Inclusão (CLAI)** e dos **Núcleos de Apoio a Pessoas com Necessidades Específicas (NAPNE)** do **Instituto Federal da Paraíba (IFPB)**.

O sistema foi concebido para transformar e centralizar o processo de acolhimento e acompanhamento pedagógico do estudante com necessidades específicas, eliminando a dispersão de documentos físicos e planilhas descentralizadas, com rigorosa observância à **LGPD (Lei Geral de Proteção de Dados)**.

### A quem atende
* **Equipe Multidisciplinar Especializada (CLAI / NAPNE):** Psicopedagogos, assistentes sociais, psicólogos, coordenadores pedagógicos, técnicos de assuntos educacionais e profissionais de apoio especializado.
* **Corpo Docente:** Professores do IFPB responsáveis pelas disciplinas curriculares, que necessitam de orientações e diretrizes pedagógicas individualizadas para adaptação curricular e metodológica, com acesso restrito a dados não médicos.
* **Gestão e Coordenação Institucional:** Administradores do sistema com controle total de perfis, auditoria e revogação de acessos.

### O que ele faz
* **Gestão Cadastral de Estudantes (US 12):** Cadastro completo, busca paginada multicritério (termo, curso, turma, tags), atualização cadastral e inativação lógica de negócio (`INATIVO` / `EVADIDO`) preservando o histórico integral de prontuários.
* **Catálogo de Indicadores e Tags:** Seleção padronizada de barreiras de aprendizagem e tags de acessibilidade reutilizáveis.
* **Fluxo de Estudo de Caso (US 02):** Registro e diagnóstico inicial das barreiras de aprendizagem, com seleção de indicadores reutilizáveis e validação estrita para emissão de planos de ação.
* **PEI (Plano Educacional Individualizado — US 03):** Construção colaborativa do planejamento pedagógico global do estudante, com registro de habilidades, interesses e adaptações gerais.
* **PEA (Plano de Ensino Adaptado por Disciplina — US 03):** Definição das metodologias, objetivos, critérios de avaliação e recursos de acessibilidade específicos para cada componente curricular cursado pelo discente.
* **Prontuário Unificado e Sigilo LGPD (US 09 / TA11.3):** Visão 360° do estudante com proteção e omissão de dados sensíveis (histórico familiar e socioemocional) para perfis com acesso funcional (professores).
* **Gestão de Anexos com Criptografia em Repouso (US 09 / US 11):** Armazenamento de laudos médicos e documentos clínicos com cifragem simétrica **AES-256-GCM** em disco e controle de autorização de saúde.
* **Linha do Tempo Unificada (Timeline):** Rastreabilidade cronológica consolidada de intervenções, atendimentos, elaboração de PEI/PEA e atualizações de estudos de caso.
* **Autenticação e RBAC Granular (US 11):** Arquitetura stateless baseada em **Spring Security OAuth2 Resource Server** com JWT, separação de níveis de restrição (`SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL`) e revogação imediata de credenciais em tempo real.

---

## 2. Stack Utilizada

Todas as versões abaixo foram extraídas com precisão dos arquivos de configuração oficiais do projeto ([`app/backend/pom.xml`](app/backend/pom.xml) e [`app/frontend/package.json`](app/frontend/package.json)).

### Backend
| Tecnologia | Versão Exata | Finalidade no Projeto |
| :--- | :--- | :--- |
| **Java** | `21` | Linguagem base (LTS), com recursos modernos de virtual threads e records |
| **Spring Boot** | `4.1.1` | Framework corporativo base da aplicação e gerenciador da API REST |
| **Spring Security** | *(gerenciado por Spring Boot 4.1.1)* | Camada de segurança corporativa, controle de sessão stateless e anotações `@PreAuthorize` |
| **OAuth2 Resource Server** | *(gerenciado por Spring Boot 4.1.1)* | Decodificação e validação nativa de tokens JWT (`NimbusJwtDecoder` com HMAC-SHA256) |
| **Spring Data JPA** | *(gerenciado por Spring Boot 4.1.1)* | Abstração de persistência relacional com repositórios e `@EntityGraph` para evitar N+1 |
| **Hibernate Core** | *(gerenciado por Spring Boot 4.1.1)* | Implementação ORM com suporte a PostgreSQL Dialect e auditoria de soft-delete (`@SoftDelete`) |
| **Jakarta Bean Validation** | *(gerenciado por Spring Boot 4.1.1)* | Validação declarativa de DTOs (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`) |
| **Spring WebMVC** | *(gerenciado por Spring Boot 4.1.1)* | Camada web REST com CORS integrado (`http://localhost:5173`) e tratamento via RFC 9457 |
| **Spring Boot Actuator** | *(gerenciado por Spring Boot 4.1.1)* | Telemetria, monitoramento e health checks operacionais da aplicação |
| **Spring Boot DevTools** | *(gerenciado por Spring Boot 4.1.1)* | Recarregamento rápido em ambiente de desenvolvimento local |
| **PostgreSQL JDBC Driver** | *(gerenciado por Spring Boot 4.1.1)* | Driver de conectividade nativa com o banco de dados PostgreSQL |
| **Criptografia AES-256-GCM** | Padrão NIST | Cifragem simétrica autenticada em repouso para laudos clínicos e anexos de estudantes |
| **BCrypt** | Padrão OpenBSD | Algoritmo com sal para hashing seguro de credenciais de usuários |
| **Maven Wrapper (`mvnw`)** | *(incluso em `app/backend/`)* | Automação padronizada de build e resolução de dependências |
| **Flyway** | *(gerenciado por Spring Boot 4.1.1)* | Versionamento automático do schema DDL (`db/migration`) e seeds de desenvolvimento (`db/seed/dev`) no PostgreSQL |
| *Observação sobre Lombok* | — | *Não utilizado.* O projeto adota código Java explícito sem metaprogramação |

### Frontend
| Tecnologia | Versão Exata | Finalidade no Projeto |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Biblioteca reativa para construção da interface declarativa e orientada a componentes |
| **React DOM** | `^19.2.8` | Renderizador web nativo acoplado ao `createRoot` |
| **TypeScript** | `~6.0.2` | Superset tipado para garantia estática de tipos e robustez em tempo de compilação |
| **Vite** | `^8.3.0` | Servidor de desenvolvimento ultrarrápido com Hot Module Replacement (HMR) e bundler otimizado |
| **@vitejs/plugin-react** | `^6.1.1` | Integração do Vite com o ecossistema React (Fast Refresh e parser JSX/TSX via Oxc) |
| **Tailwind CSS** | `^3.4.19` | Framework de CSS utilitário configurado com a paleta institucional oficial do IFPB |
| **PostCSS** | `^8.5.29` | Ferramenta de transformação de CSS com plugins modernos |
| **Autoprefixer** | `^10.6.1` | Injeção automática de vendor prefixes de compatibilidade entre navegadores |
| **Lucide React** | `^1.55.0` | Biblioteca de ícones vetoriais modernos e acessíveis em SVG |
| **React Router DOM** | `^7.18.4` | Roteamento client-side com rotas protegidas (`RotaProtegida`) |
| **Oxlint** | `^1.81.0` | Linter estático de altíssima performance para regras React e boas práticas TypeScript |
| **@types/node** | `^24.13.3` | Definições de tipagem do Node.js para scripts e arquivos de configuração |
| **@types/react** / **react-dom** | `^19.2.18` / `^19.2.7` | Tipagens estáticas do ecossistema React |

### Ferramentas, Banco de Dados e Qualidade
| Tecnologia | Versão / Padrão | Finalidade no Projeto |
| :--- | :--- | :--- |
| **PostgreSQL** | `>= 14.x` *(Docker: `16-alpine`)* | Sistema de banco relacional principal (database `sigi_clai`, schema `sigi`) |
| **pgAdmin 4 / DBeaver** | — | Ferramentas visuais recomendadas para inspeção do banco `sigi_clai` e histórico do Flyway |
| **Postman / Newman** | `Collection v2.1` | Suíte de testes automatizados de integração de API (`app/backend/collection/`) para US02, US03 e US11 |
| **RFC 9457 (Problem Details)** | Padrão IETF | Estrutura semântica padronizada de mensagens de erro HTTP (`application/problem+json`) |
| **Vite Dev Server Proxy** | — | Roteamento transparente de chamadas `/api` no frontend para `http://localhost:8080` |

---

## 3. Guia de Instalação e Execução

> [!TIP]
> **Execução Rápida com Docker (Recomendado — Task #46):**
> Você pode subir todo o ambiente de forma 100% isolada e com um único comando na raiz do projeto:
> ```bash
> # Ambiente de Desenvolvimento (padrão):
> cp .env.example .env && docker compose -f docker-compose.dev.yml up -d --build
> # (ou simplesmente: docker compose up -d --build)
>
> # Ambiente de Produção:
> cp .env.example .env && docker compose -f docker-compose.prd.yml up -d --build
> ```
> Na inicialização do `sigi-backend`, o **Flyway** aplica automaticamente as migrations estruturais (`classpath:db/migration`) e, exclusivamente em `dev`, os seeds iniciais (`classpath:db/seed/dev`), validados em seguida pelo Hibernate (`ddl-auto: validate`). Para instruções completas de arquitetura, perfis Spring Boot (`dev` e `prd`), conexão via DBeaver e *troubleshooting*, consulte o [**Guia de Execução com Docker (`DOCKER_GUIDE.md`)**](DOCKER_GUIDE.md).

### Pré-requisitos (Execução Tradicional / Local)
Certifique-se de ter os seguintes componentes instalados no seu ambiente:
* **Java Development Kit (JDK):** Versão **21** (ou superior). Verifique com `java -version`.
* **Node.js:** Versão **20.x** ou superior (acompanhado do `npm`). Verifique com `node -v` e `npm -v`.
* **PostgreSQL:** Versão **14+** em execução na porta padrão `5432`.
* **Git:** Para clonagem e controle de versão.

---

### Passo 1 — Clonar o Repositório

```bash
git clone https://github.com/Nycollas-S/Sistema-Integrado-de-Gestao-Inclusiva.git
cd Sistema-Integrado-de-Gestao-Inclusiva
```

---

### Passo 2 — Configurar e Rodar o Backend

A API do Spring Boot está localizada no diretório `app/backend`.

#### 2.1. Preparar o Banco de Dados PostgreSQL
1. Inicie seu servidor PostgreSQL local (porta `5432`).
2. Conecte-se via pgAdmin, DBeaver ou terminal `psql` e crie apenas a base de dados vazia:
   ```sql
   CREATE DATABASE sigi_clai;
   ```
3. Ao subir a aplicação Spring Boot, o **Flyway** criará automaticamente o schema `sigi`, as tabelas, constraints, índices (`app/backend/src/main/resources/db/migration/`) e, quando o perfil `dev` estiver ativo, os dados iniciais de teste (`app/backend/src/main/resources/db/seed/dev/`). Em `prd`, apenas as migrations estruturais são executadas.
   *(Todos os scripts de seed são idempotentes com `ON CONFLICT DO NOTHING`).*

#### 2.2. Variáveis de Ambiente do Backend
O arquivo `app/backend/src/main/resources/application-dev.yaml` já possui valores padrão predefinidos para desenvolvimento local:
* **URL:** `jdbc:postgresql://localhost:5432/sigi_clai`
* **Usuário:** variável `POSTGRES_USER` ou `SPRING_DATASOURCE_USERNAME` (padrão: `postgres`)
* **Senha:** variável `POSTGRES_PASSWORD` ou `SPRING_DATASOURCE_PASSWORD` (padrão: `postgres`)
* **JWT Secret:** variável `JWT_SECRET` (padrão: `sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod`)
* **Chave AES:** variável `AES_KEY` (padrão: `0123456789abcdef0123456789abcdef`)

Caso suas credenciais locais do PostgreSQL sejam diferentes, configure as variáveis antes de iniciar:
```bash
# Linux / macOS (Bash/Zsh)
export POSTGRES_USER=seu_usuario
export POSTGRES_PASSWORD=sua_senha

# Windows (PowerShell)
$env:POSTGRES_USER="seu_usuario"
$env:POSTGRES_PASSWORD="sua_senha"
```

#### 2.3. Compilar e Iniciar a Aplicação
Navegue até a pasta do backend e utilize o Maven Wrapper:

* **No Linux / macOS:**
  ```bash
  cd app/backend
  ./mvnw spring-boot:run
  ```

* **No Windows (PowerShell / CMD):**
  ```powershell
  cd app\backend
  .\mvnw.cmd spring-boot:run
  ```

A API inicializará e estará pronta para receber requisições na porta **`8080`**:
```
http://localhost:8080
```

#### 2.4. Credenciais de Acesso Pré-Cadastradas (Seed US 11)
Para testar os fluxos com diferentes perfis e validações da matriz de permissões RBAC:

| E-mail | Senha Padrão | Perfil (`Role`) | Nível de Restrição | Permissões Especiais |
| :--- | :--- | :--- | :--- | :--- |
| `admin@sigi.ifpb.edu.br` | `senha123` | `ADMIN` | `SUPER_RESTRICAO` | Acesso irrestrito, laudos clínicos e gestão de acessos |
| `coordenador@sigi.ifpb.edu.br` | `senha123` | `COORDENADOR` | `SUPER_RESTRICAO` | Visão completa de prontuários e estudos |
| `psicopedagogo@sigi.ifpb.edu.br` | `senha123` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | Dados socioemocionais, PEI e autorização de saúde |
| `professor@sigi.ifpb.edu.br` | `senha123` | `PROFESSOR` | `ACESSO_FUNCIONAL` | Adaptações curriculares e PEA (dados médicos omitidos via LGPD) |
| `aluno.apoiador@sigi.ifpb.edu.br` | `senha123` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | Acompanhamento funcional básico |

---

### Passo 3 — Configurar e Rodar o Frontend

O frontend está localizado no diretório `app/frontend`.

#### 3.1. Acessar a pasta e instalar dependências
Abra um novo terminal a partir da raiz do repositório:
```bash
cd app/frontend
npm install
```

#### 3.2. Configuração de Variáveis de Ambiente (`.env`)
O arquivo [`.env.example`](app/frontend/.env.example) serve de modelo:
```bash
# No Linux / macOS
cp .env.example .env

# No Windows (PowerShell)
Copy-Item .env.example .env
```
Conteúdo do arquivo `.env`:
```env
# Mantenha como "false" para integração ativa com o backend Spring Boot.
# Se definido como "true", simula os dados via localStorage em caso de indisponibilidade da API.
VITE_USE_LOCAL_FALLBACK=false
```

#### 3.3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em:
```
http://localhost:5173
```
Faça login com qualquer uma das credenciais da tabela da seção 2.4 (ex.: `admin@sigi.ifpb.edu.br` / `senha123`).

---

### Comandos Úteis de Validação e Testes

Para garantir que o código atende a todos os critérios de compilação, tipos e segurança antes de realizar commits:

#### Checagem Estática de Tipos (Frontend)
Executa a validação rigorosa do compilador TypeScript:
```bash
# Na pasta app/frontend
npx tsc -b
```

#### Análise Estática de Código / Linter (Frontend)
Verifica convenções de código, regras de hooks do React e boas práticas:
```bash
# Na pasta app/frontend
npm run lint
```

#### Testes Automatizados do Backend (JUnit 5 / Spring Boot)
Executa a suíte de testes unitários, testes de repositório, validações e contexto de segurança:
```bash
# Na pasta app/backend
# Linux / macOS:
./mvnw test

# Windows:
.\mvnw.cmd test
```

#### Testes Automatizados de API via Newman (Postman)
Executa as coleções oficiais de contrato e regras de negócio via terminal:
```bash
# Na pasta app/backend

# US 02 - Estudo de Caso:
npx newman run collection/US02/SIGI_EstudoDeCaso.postman_collection.json -e collection/US02/SIGI_Environment.postman_environment.json

# US 03 - Planejamento Pedagógico (PEI e PEA):
npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json -e collection/US03/SIGI_Environment.postman_environment.json

# US 11 - Autenticação JWT, Perfis RBAC e Matriz de Permissões:
npx newman run collection/US11/SIGI_US11_Autenticacao_RBAC.postman_collection.json -e collection/US11/SIGI_US11_Environment.postman_environment.json
```

#### Scripts de Auditoria de Segurança (PowerShell)
Localizados em `app/backend/collection/US11/`:
* `.\test_matriz_granular.ps1`: Valida a matriz de permissões por perfil (200 vs 403 em dados sensíveis).
* `.\test_revogacao_sessao.ps1`: Valida a revogação imediata de credenciais (401 após `revogar-acesso`).
* `.\test_criptografia_anexos.ps1`: Valida a integridade da cifragem AES-256-GCM em disco.

---

## 4. Endpoints e Funcionalidades da Entrega

Todas as rotas de negócio operam sob o padrão RESTful com payload JSON e exigem o cabeçalho HTTP:
```http
Authorization: Bearer <token_jwt>
```
O autor da ação (`criado_por` / `atualizado_por`) é resolvido de forma infalsificável a partir da claim `userId` do JWT autenticado.

---

### 4.1. Módulo Autenticação e Sessão (`/api/auth`)
Responsável pela emissão e verificação do token JWT para os usuários do sistema (US 11).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | *Público* | Autentica usuário com e-mail/senha e emite token JWT com perfil e nível de restrição |
| `GET` | `/api/auth/me` | `Authorization: Bearer <token>` | Retorna os dados da sessão do usuário autenticado no token |

---

### 4.2. Módulo Administrativo de Usuários (`/api/admin/usuarios`)
Gestão de acessos exclusiva para usuários com perfil `ROLE_ADMIN` (US 11).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/usuarios` | `Authorization: Bearer <token>` | Lista todos os usuários cadastrados e o status de seus acessos |
| `PATCH` | `/api/admin/usuarios/{id}/revogar-acesso` | `Authorization: Bearer <token>` | Revoga imediatamente as credenciais do usuário (`acessoAtivo = false`), invalidando tokens emitidos (**TA11.4**) |

---

### 4.3. Módulo Gestão de Estudantes (`/api/alunos`)
Gestão cadastral, filtros combinados multicritério e ciclo de vida de discentes (US 12).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/alunos` | `Authorization: Bearer <token>` | Cadastra um novo discente com matrícula única, curso, turma e tags de dificuldade |
| `GET` | `/api/alunos` | `Authorization: Bearer <token>` | Lista estudantes com paginação e filtros (`termo`, `curso`, `turma`, `tag`, `ativo`) |
| `GET` | `/api/alunos/{id}` | `Authorization: Bearer <token>` | Busca dados detalhados de um estudante por seu UUID |
| `GET` | `/api/alunos/{id}/acompanhamento` | `Authorization: Bearer <token>` | Busca ou cria automaticamente o registro de `acompanhamento` para emissão de PEI/PEA |
| `PUT` | `/api/alunos/{id}` | `Authorization: Bearer <token>` | Atualiza dados cadastrais e vínculos de tags do discente |
| `DELETE` | `/api/alunos/{id}` | `Authorization: Bearer <token>` | Inativação lógica de negócio (`ativo = false`, `status = INATIVO` ou `EVADIDO`), preservando histórico |

---

### 4.4. Módulo Catálogo de Indicadores (`/api/indicadores`)
Catálogo compartilhado de tags de acessibilidade e barreiras de aprendizagem (US 12 / US 02).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/indicadores` | `Authorization: Bearer <token>` | Lista todas as tags e indicadores reutilizáveis ativos para formulários e filtros |

---

### 4.5. Módulo Estudo de Caso (`/api/estudos-de-caso`)
Base para acolhimento do estudante e diagnóstico das necessidades especiais (US 02).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/estudos-de-caso/{id}` | `Authorization: Bearer <token>` | Retorna um estudo de caso específico por seu UUID |
| `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | `Authorization: Bearer <token>` | Lista todos os estudos de caso registrados para o aluno |
| `POST` | `/api/estudos-de-caso` | `Authorization: Bearer <token>` | Cria um estudo de caso com status `RASCUNHO` ou `ATIVO` |
| `PUT` | `/api/estudos-de-caso/{id}` | `Authorization: Bearer <token>` | Atualiza diagnóstico, indicadores ou conclui o estudo |
| `DELETE` | `/api/estudos-de-caso/{id}` | `Authorization: Bearer <token>` | Exclui o rascunho de um estudo de caso (estudos concluídos são protegidos) |

* **Regras de Negócio Chave:**
  * **TA2.1:** Bloqueio de criação de Plano de Ação enquanto o Estudo de Caso estiver com status pendente ou rascunho.
  * **TA2.3:** A conclusão do estudo exige obrigatoriamente preenchimento de diagnóstico inicial e seleção de pelo menos um indicador reutilizável de barreira.
  * **TA2.4:** Índice parcial único no banco de dados (`idx_estudo_caso_ativo`) impede que um aluno possua mais de um estudo de caso ativo concomitantemente.
  * **LGPD:** Campos de histórico familiar e socioemocional são omitidos do JSON de resposta caso o usuário autenticado possua perfil `PROFESSOR` ou `ACESSO_FUNCIONAL`.

---

### 4.6. Módulo PEA — Plano de Ensino Adaptado (`/api/peas`)
Planejamento curricular individualizado por disciplina ministrada pelo docente (US 03).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/peas` | `Authorization: Bearer <token>` | Lista todos os PEAs cadastrados no sistema |
| `GET` | `/api/peas/{id}` | `Authorization: Bearer <token>` | Busca detalhes de um PEA específico |
| `GET` | `/api/peas/acompanhamento/{acompanhamentoId}` | `Authorization: Bearer <token>` | Lista todos os PEAs vinculados a um acompanhamento |
| `GET` | `/api/peas/aluno/{alunoId}` | `Authorization: Bearer <token>` | Lista o histórico de PEAs de um aluno |
| `POST` | `/api/peas` | `Authorization: Bearer <token>` | Cadastra um novo PEA associado a um acompanhamento |
| `PUT` | `/api/peas/{id}` | `Authorization: Bearer <token>` | Atualiza objetivos, adaptações metodológicas e critérios de avaliação |
| `DELETE` | `/api/peas/{id}` | `Authorization: Bearer <token>` | Realiza a inativação (*soft delete*) do PEA via Hibernate |

---

### 4.7. Módulo PEI — Plano Educacional Individualizado (`/api/peis`)
Documento norteador institucional contendo as diretrizes pedagógicas globais do discente (US 03).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/peis` | `Authorization: Bearer <token>` | Lista todos os planos educacionais individualizados ativos |
| `GET` | `/api/peis/{id}` | `Authorization: Bearer <token>` | Detalhes do PEI com resolução automática de dados do discente |
| `GET` | `/api/peis/acompanhamento/{acompanhamentoId}` | `Authorization: Bearer <token>` | Lista PEIs vinculados a um acompanhamento |
| `GET` | `/api/peis/aluno/{alunoId}` | `Authorization: Bearer <token>` | Lista PEIs vinculados a um aluno |
| `GET` | `/api/peis/{id}/anexos-sensiveis` | `Authorization: Bearer <token>` | Consulta anexos sensíveis e laudos clínicos (**Controle de Acesso TA3.2 / TA11.3 — RESTRICAO_MODERADA ou superior**) |
| `POST` | `/api/peis` | `Authorization: Bearer <token>` | Cria um novo PEI a partir do acompanhamento (**TA3.1**) |
| `PUT` | `/api/peis/{id}` | `Authorization: Bearer <token>` | Atualiza metas, habilidades e propostas de adaptação |
| `DELETE` | `/api/peis/{id}` | `Authorization: Bearer <token>` | Inativa o PEI via *soft delete* preservando os registros de auditoria (**TA3.4**) |

* **Regras de Negócio Chave:**
  * **TA3.2 e TA11.3 (Segurança de Dados Sensíveis):** O endpoint `/api/peis/{id}/anexos-sensiveis` exige autorização `RESTRICAO_MODERADA` ou superior (`@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")`), retornando **`403 Forbidden`** para perfis `Professor` ou `ACESSO_FUNCIONAL`.
  * **TA3.4 (Auditoria e Soft Delete):** A inativação de um PEI marca o campo booleano `deleted = true` e atualiza a trilha de auditoria (`atualizado_por`, `atualizado_em`), impedindo exclusão em cascata das tabelas associadas (`sigi.pea`, `sigi.aluno`, `sigi.acompanhamento`).

---

### 4.8. Módulo Prontuário Unificado e Sigilo LGPD (`/api/alunos/{estudanteId}/prontuario`)
Consolidação do prontuário com segregação estrita de dados médicos e socioemocionais (US 09 / TA11.3).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alunos/{estudanteId}/prontuario` | `Authorization: Bearer <token>` | Consulta unificada do prontuário (dados sensíveis são omitidos para perfil `PROFESSOR`) |
| `GET` | `/api/alunos/{estudanteId}/historico-socioemocional` | `Authorization: Bearer <token>` | Consulta de histórico socioemocional e familiar (exclusivo para `RESTRICAO_MODERADA` ou superior; **403** para professores) |

---

### 4.9. Módulo Linha do Tempo / Timeline (`/api/alunos/{alunoId}/timeline`)
Rastreabilidade unificada de todo o ciclo assistencial do discente em ordem cronológica.

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alunos/{alunoId}/timeline` | `Authorization: Bearer <token>` | Recupera a lista ordenada de intervenções, atendimentos, elaboração de PEI/PEA e atualizações de estudos de caso |

---

### 4.10. Módulo Gestão de Anexos e Criptografia em Repouso (`/api/alunos/{id}/anexos`)
Upload e download seguro de documentos pedagógicos e laudos médicos com cifragem AES-256-GCM (US 09 / US 11).

| Método | Endpoint | Cabeçalho | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/alunos/{id}/anexos` | `Authorization: Bearer <token>` *(multipart)* | Realiza upload de documentos; arquivos sensíveis são cifrados em disco com AES-256-GCM (**TA11.1**) |
| `GET` | `/api/alunos/{id}/anexos` | `Authorization: Bearer <token>` | Lista todos os anexos vinculados ao estudante |
| `GET` | `/api/anexos/{anexoId}/download` | `Authorization: Bearer <token>` | Decodifica e realiza o download do documento (**TA11.2 — exige SUPER_RESTRICAO e autorização de saúde**) |

---

### 4.11. Recursos de Interface (Frontend)
* **Tela de Login (`/login`) e Proteção de Rotas:** Autenticação por e-mail e senha, armazenamento seguro do token JWT, interceptor de expiração de sessão com redirecionamento (401) e modal de bloqueio LGPD (`ModalAcessoNegadoLGPD`) para tentativas não autorizadas (403).
* **Gestão de Estudantes (`/estudantes`):** Tabela paginada rica com filtros rápidos combinados (nome/matrícula, curso, turma, tags de acessibilidade, status ativo), modais de cadastro de novos alunos e inativação lógica (`INATIVO` / `EVADIDO`).
* **Painel Administrativo de Usuários (`/admin/usuarios`):** Acesso exclusivo para administradores (`ROLE_ADMIN`), permitindo visualização de perfis, auditoria e revogação imediata de credenciais em tempo real.
* **Prontuário Inclusivo com Barra de Atalhos Rápidos (`ProntuarioQuickActions`):** Modais integrados para Novo Atendimento, Novo Estudo de Caso, Emissão de RAE (Relatório de Atendimento Educacional Especializado) e Geração de Dossiê com atualização imediata da Linha do Tempo.
* **Tratamento Visual RBAC e Sigilo LGPD (`SecaoProntuarioRbac`):** Interface adaptativa que oculta seções confidenciais (laudos clínicos, pareceres diagnósticos e histórico socioemocional) quando visualizada por professores ou perfis de acesso funcional.
* **Formulários Especializados:** Formulário de Estudo de Caso (`/estudo-de-caso`) com seleção dinâmica de tags/indicadores, formulário de PEI (`/pei`) e formulário de PEA (`/pea`) com suporte a múltiplos planos por disciplina.
* **Header Institucional Oficial:** Identidade visual do IFPB, indicação de campus (CLAI Cajazeiras/Sousa) e acessibilidade integrada com o componente flutuante **VLibras**.
* **Notificações Flutuantes (Toast Alert):** Feedback em tempo real com suporte a mensagens de erro padronizadas pelo protocolo **RFC 9457**.
* **Modo Offline / Fallback Integrado:** Possibilidade de execução da interface em modo de demonstração via `localStorage` sem backend ativo (controlado pela flag `VITE_USE_LOCAL_FALLBACK`).

---

## 5. Licença

Este projeto é desenvolvido para fins acadêmicos e institucionais vinculados ao **Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB)**.
