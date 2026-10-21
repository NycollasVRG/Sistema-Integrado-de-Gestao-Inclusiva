# SIGI / CLAI — Sistema Integrado de Gestão Inclusiva

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange?style=for-the-badge)](#)

---

## 1. Sobre

O **SIGI / CLAI (Sistema Integrado de Gestão Inclusiva)** é uma solução tecnológica desenvolvida para atender às demandas de gestão pedagógica, documental e assistencial no âmbito da **Coordenação Local de Acessibilidade e Inclusão (CLAI)** e dos **Núcleos de Apoio a Pessoas com Necessidades Específicas (NAPNE)** do **Instituto Federal da Paraíba (IFPB)**.

O sistema foi concebido para transformar e centralizar o processo de acolhimento e acompanhamento pedagógico do estudante com necessidades específicas, eliminando a dispersão de documentos físicos e planilhas descentralizadas.

### A quem atende
* **Equipe Multidisciplinar Especializada:** Psicopedagogos, assistentes sociais, psicólogos, coordenadores pedagógicos, técnicos de assuntos educacionais e profissionais de saúde e apoio especializado.
* **Corpo Docente:** Professores do IFPB responsáveis pelas disciplinas curriculares, que necessitam de orientações e diretrizes pedagógicas individualizadas para adaptação curricular e metodológica.

### O que ele faz
* **Gestão do Prontuário Inclusivo:** Centraliza todo o ciclo de vida educacional do estudante assistido.
* **Fluxo de Estudo de Caso:** Registro e diagnóstico inicial das barreiras de aprendizagem, com seleção de indicadores reutilizáveis e validação estrita para emissão de planos de ação.
* **PEI (Plano Educacional Individualizado):** Construção colaborativa do planejamento pedagógico global do estudante, com registro de habilidades, interesses e adaptações gerais.
* **PEA (Plano de Ensino Adaptado por Disciplina):** Definição das metodologias, objetivos, critérios de avaliação e recursos de acessibilidade específicos para cada componente curricular cursado pelo discente.
* **Linha do Tempo Unificada (Timeline):** Rastreabilidade cronológica de eventos, intervenções, atendimentos, emissões de laudos e atualizações pedagógicas.
* **Controle de Acesso e Segurança (LGPD):** Segregação de acesso a laudos, pareceres diagnósticos e anexos sensíveis por perfil de usuário (garantindo que docentes acessem apenas as adaptações pedagógicas necessárias para sua aula, resguardando dados médicos e socioemocionais sigilosos da equipe multiprofissional).

---

## 2. Stack Utilizada

Todas as versões abaixo foram extraídas com precisão dos arquivos de configuração oficiais do projeto ([`app/backend/pom.xml`](file:///app/backend/pom.xml) e [`app/frontend/package.json`](file:///app/frontend/package.json)).

### Backend
| Tecnologia | Versão Exata | Finalidade no Projeto |
| :--- | :--- | :--- |
| **Java** | `21` | Linguagem de programação base (LTS), com recursos modernos de virtual threads e records |
| **Spring Boot** | `4.1.1` | Framework corporativo base da aplicação e gerenciador de microsserviços/API REST |
| **Spring Data JPA** | *(gerenciado por Spring Boot 4.1.1)* | Abstração de persistência relacional com repositórios e consultas tipadas |
| **Hibernate Core** | *(gerenciado por Spring Boot 4.1.1)* | Implementação ORM com suporte a PostgreSQL Dialect e auditoria de soft-delete |
| **Jakarta Bean Validation** | *(gerenciado por Spring Boot 4.1.1)* | Validação declarativa de integridade de DTOs (`@Valid`, `@NotNull`, `@NotBlank`, `@NotEmpty`) |
| **Spring WebMVC** | *(gerenciado por Spring Boot 4.1.1)* | Camada web para exposição de endpoints HTTP REST e manipulação de erros com RFC 9457 |
| **Spring Boot Actuator** | *(gerenciado por Spring Boot 4.1.1)* | Monitoramento, telemetria e health checks operacionais da aplicação |
| **Spring Boot DevTools** | *(gerenciado por Spring Boot 4.1.1)* | Recarregamento rápido em ambiente de desenvolvimento local |
| **PostgreSQL JDBC Driver** | *(gerenciado por Spring Boot 4.1.1)* | Driver de conectividade nativa com o banco de dados PostgreSQL |
| **Maven Wrapper (`mvnw`)** | *(incluso em `app/backend/`)* | Ferramenta padronizada de automação de build e resolução de dependências |
| *Observação sobre Flyway / Lombok* | — | *Não utilizados.* O projeto optou pela execução direta de scripts DDL versionados em SQL nativo e código Java explícito sem metaprogramação |

### Frontend
| Tecnologia | Versão Exata | Finalidade no Projeto |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Biblioteca reativa para construção da interface de usuário declarativa e orientada a componentes |
| **React DOM** | `^19.2.8` | Renderizador web nativo do React acoplado ao `createRoot` |
| **TypeScript** | `~6.0.2` | Superset tipado para garantia estática de tipos e robustez em tempo de compilação |
| **Vite** | `^8.3.0` | Servidor de desenvolvimento ultrarrápido com Hot Module Replacement (HMR) e bundler otimizado |
| **@vitejs/plugin-react** | `^6.1.1` | Integração do Vite com o ecossistema React (Fast Refresh e parser JSX/TSX via Oxc) |
| **Tailwind CSS** | `^3.4.19` | Framework de CSS utilitário configurado com a paleta institucional oficial do IFPB |
| **PostCSS** | `^8.5.29` | Ferramenta de transformação de CSS com suporte a plugins modernos |
| **Autoprefixer** | `^10.6.1` | Injeção automática de vendor prefixes de compatibilidade entre navegadores |
| **Lucide React** | `^1.55.0` | Biblioteca de ícones vetoriais modernos e acessíveis em SVG |
| **React Router DOM** | `^7.18.4` | Biblioteca de roteamento client-side |
| **Oxlint** | `^1.81.0` | Linter estático de altíssima performance para regras React e boas práticas TypeScript |
| **@types/node** | `^24.13.3` | Definições de tipagem do Node.js para scripts e arquivos de configuração |
| **@types/react** / **react-dom** | `^19.2.18` / `^19.2.7` | Tipagens estáticas do React e DOM para verificação do compilador TypeScript |

### Ferramentas, Banco de Dados e Qualidade
| Tecnologia | Versão / Padrão | Finalidade no Projeto |
| :--- | :--- | :--- |
| **PostgreSQL** | `>= 14.x` | Sistema gerenciador de banco de dados relacional principal (database `sigi_clai`, schema `sigi`) |
| **pgAdmin 4 / DBeaver** | — | Ferramentas visuais recomendadas para execução dos scripts de criação de tabelas e seeds |
| **Postman / Newman** | `Collection v2.1` | Suíte de testes de integração e validação de contratos de API automatizada (`app/backend/collection/`) |
| **RFC 9457 (Problem Details)** | Padrão IETF | Estrutura semântica padronizada de mensagens de erro HTTP (`application/problem+json`) |
| **Vite Dev Server Proxy** | — | Roteamento transparente de `/api` no frontend para `http://localhost:8080` sem bloqueios de CORS |

---

## 3. Guia de Instalação e Execução

> [!TIP]
> **Execução Rápida com Docker (Recomendado — Task #46):**
> Você pode subir todo o ambiente de forma 100% isolada e com um único comando na raiz do projeto:
> ```bash
> # Linux / macOS
> cp .env.example .env && docker compose up -d --build
>
> # Windows (PowerShell)
> Copy-Item .env.example .env; docker compose up -d --build
> ```
> Para instruções completas de arquitetura, conexão via DBeaver, comandos do dia a dia e *troubleshooting*, consulte o [**Guia de Execução com Docker (`DOCKER_GUIDE.md`)**](file:///DOCKER_GUIDE.md).

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
2. Conecte-se via pgAdmin, DBeaver ou terminal `psql` e crie a base de dados:
   ```sql
   CREATE DATABASE sigi_clai;
   ```
3. Execute o script de criação do schema `sigi` e suas tabelas:
   ```bash
   # Via psql a partir da raiz do projeto:
   psql -U postgres -d sigi_clai -f app/backend/database/create_tables.sql
   ```
   *(Ou abra e execute o arquivo `app/backend/database/create_tables.sql` na sua IDE de banco de dados).*
4. *(Opcional, porém recomendado para testes)* Execute o script de massa de dados inicial (seed):
   ```bash
   psql -U postgres -d sigi_clai -f app/backend/collection/US03/seed_test_data.sql
   ```

#### 2.2. Variáveis de Ambiente do Backend
O arquivo `app/backend/src/main/resources/application.yaml` já possui valores padrão predefinidos para conexão local:
* **Host:** `localhost:5432/sigi_clai`
* **Usuário:** variável `GROUP_DB_USER` (padrão: `postgres`)
* **Senha:** variável `GROUP_DB_PASSWORD` (padrão: `postgres`)
* **Schema padrão:** `sigi`

Caso suas credenciais do PostgreSQL sejam diferentes, configure as variáveis de ambiente antes de iniciar:
```bash
# Linux / macOS (Bash/Zsh)
export GROUP_DB_USER=seu_usuario
export GROUP_DB_PASSWORD=sua_senha

# Windows (PowerShell)
$env:GROUP_DB_USER="seu_usuario"
$env:GROUP_DB_PASSWORD="sua_senha"
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

> [!NOTE]
> **Sobre o Swagger / OpenAPI:** Nesta entrega do projeto, a documentação via `springdoc-openapi` não está configurada no `pom.xml`. As rotas, contratos e payloads estão documentados detalhadamente na [Seção 4](#4-endpoints-e-funcionalidades-da-entrega) deste README e através das coleções executáveis do Postman em [`app/backend/collection/`](file:///app/backend/collection/).

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
O arquivo [`.env.example`](file:///app/frontend/.env.example) serve de modelo:
```bash
# No Linux / macOS
cp .env.example .env

# No Windows (PowerShell)
Copy-Item .env.example .env
```
Conteúdo do arquivo `.env`:
```env
# Mantenha como "false" para integração com o backend Spring Boot.
# Se definido como "true", simula os dados via localStorage em caso de indisponibilidade da API.
VITE_USE_LOCAL_FALLBACK=false
```
> [!TIP]
> O frontend conta com um **proxy de desenvolvimento** embutido no `vite.config.ts`. Todas as chamadas para `/api/*` são automaticamente direcionadas para `http://localhost:8080`, sem necessidade de configuração adicional de CORS.

#### 3.3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no seu navegador:
```
http://localhost:5173
```

---

### Comandos Úteis de Validação e Testes

Para garantir que o código atende a todos os critérios de qualidade e compilação antes de commits:

#### Checagem Estática de Tipos (Frontend)
Executa a validação rigorosa do compilador TypeScript (`tsconfig.json` e referências):
```bash
# Na pasta app/frontend
npx tsc -b
```

#### Análise Estática de Código / Linter (Frontend)
Verifica convenções de código, regras de hooks e exports através do Oxlint:
```bash
# Na pasta app/frontend
npm run lint
# ou explicitamente:
npx oxlint src
```

#### Testes Automatizados do Backend
Executa a suíte de testes unitários e de contexto do Spring Boot:
```bash
# Na pasta app/backend
# Linux / macOS:
./mvnw test

# Windows:
.\mvnw.cmd test
```

#### Testes de Integração de API (Postman / Newman)
Executa todas as asserções de contrato e regras de negócio via terminal com o Newman:
```bash
# Na pasta app/backend
npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json -e collection/US03/SIGI_Environment.postman_environment.json
```

---

## 4. Endpoints e Funcionalidades da Entrega

A entrega atual contempla a implementação completa das regras de negócio do prontuário inclusivo, organizadas nos seguintes módulos:

### 4.1. Módulo Estudo de Caso (`/api/estudos-de-caso`)
Base para acolhimento do estudante e diagnóstico das necessidades especiais (US 02).

| Método | Endpoint | Cabeçalhos | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/estudos-de-caso/{id}` | — | Retorna um estudo de caso específico por seu UUID |
| `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | — | Lista todos os estudos de caso registrados para o aluno |
| `POST` | `/api/estudos-de-caso` | `X-User-Id` *(opcional)* | Cria um estudo de caso com status `RASCUNHO` ou `ATIVO` |
| `PUT` | `/api/estudos-de-caso/{id}` | `X-User-Id` *(opcional)* | Atualiza diagnóstico, indicadores ou conclui o estudo |
| `DELETE` | `/api/estudos-de-caso/{id}` | `X-User-Id` *(opcional)* | Exclui o rascunho de um estudo de caso (estudos concluídos são protegidos) |

* **Regras de Negócio Chave:**
  * **TA2.1:** Bloqueio de criação de Plano de Ação enquanto o Estudo de Caso estiver com status pendente ou rascunho.
  * **TA2.3:** A conclusão do estudo exige obrigatoriamente preenchimento de diagnóstico inicial e seleção de pelo menos um indicador reutilizável de barreira.

---

### 4.2. Módulo PEA — Plano de Ensino Adaptado (`/api/peas`)
Planejamento curricular individualizado por disciplina ministrada pelo professor (US 03).

| Método | Endpoint | Cabeçalhos | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/peas` | — | Lista todos os PEAs cadastrados no sistema |
| `GET` | `/api/peas/{id}` | — | Busca detalhes de um PEA específico |
| `GET` | `/api/peas/acompanhamento/{acompanhamentoId}` | — | Lista todos os PEAs vinculados a um acompanhamento |
| `GET` | `/api/peas/aluno/{alunoId}` | — | Lista o histórico de PEAs de um aluno |
| `POST` | `/api/peas` | `X-User-Id` *(obrigatório)* | Cadastra um novo PEA associado a um acompanhamento |
| `PUT` | `/api/peas/{id}` | `X-User-Id` *(obrigatório)* | Atualiza objetivos, adaptações e critérios do PEA |
| `DELETE` | `/api/peas/{id}` | `X-User-Id` *(obrigatório)* | Realiza a inativação (*soft delete*) do PEA |

---

### 4.3. Módulo PEI — Plano Educacional Individualizado (`/api/peis`)
Documento norteador institucional contendo as diretrizes pedagógicas globais do estudante (US 03).

| Método | Endpoint | Cabeçalhos | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/peis` | — | Lista todos os planos educacionais individualizados ativos |
| `GET` | `/api/peis/{id}` | — | Detalhes do PEI com resolução automática de dados do discente |
| `GET` | `/api/peis/acompanhamento/{acompanhamentoId}` | — | Lista PEIs vinculados a um acompanhamento |
| `GET` | `/api/peis/aluno/{alunoId}` | — | Lista PEIs vinculados a um aluno |
| `GET` | `/api/peis/{id}/anexos-sensiveis` | `X-User-Perfil` | Consulta anexos sensíveis e laudos clínicos (**Controle de Acesso TA3.2**) |
| `POST` | `/api/peis` | `X-User-Id` *(obrigatório)* | Cria um novo PEI a partir do acompanhamento (**TA3.1**) |
| `PUT` | `/api/peis/{id}` | `X-User-Id` *(obrigatório)* | Atualiza metas, habilidades e propostas de adaptação |
| `DELETE` | `/api/peis/{id}` | `X-User-Id` *(obrigatório)* | Inativa o PEI via *soft delete* preservando os registros de auditoria (**TA3.4**) |

* **Regras de Negócio Chave:**
  * **TA3.2 (Segurança de Dados Sensíveis):** O endpoint `/api/peis/{id}/anexos-sensiveis` rejeita requisições identificadas com perfil `Professor` com status **`403 Forbidden`**, preservando o sigilo de dados de saúde do estudante.
  * **TA3.4 (Auditoria e Soft Delete):** A inativação de um PEI marca o campo booleano `deleted = true` e atualiza a trilha de auditoria (`atualizado_por`, `atualizado_em`), impedindo exclusão em cascata das tabelas associadas (`sigi.pea`, `sigi.aluno`, `sigi.acompanhamento`).

---

### 4.4. Módulo Linha do Tempo / Timeline (`/api/alunos/{alunoId}/timeline`)
Consolidação unificada de todo o histórico do prontuário do aluno em ordem cronológica.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/alunos/{alunoId}/timeline` | Recupera a lista ordenada de intervenções, atendimentos, elaboração de PEI/PEA e atualizações de estudos de caso do aluno |

---

### 4.5. Recursos de Interface (Frontend)
* **Header Institucional:** Padrão visual do IFPB, indicação de campus (CLAI Cajazeiras/Sousa) e acessibilidade integrada com o botão flutuante **VLibras**.
* **Ficha do Discente:** Apresentação da foto, nome, matrícula, curso e status do acolhimento.
* **Formulário Reativo:** Gerenciamento de rascunhos, seleção dinâmica de indicadores (tags de dificuldades e barreiras) e bloqueios visuais de ações em conformidade com o status pedagógico.
* **Notificações Flutuantes (Toast Alert):** Feedback em tempo real para ações de salvamento, alertas de validação e erros de comunicação tratados via **RFC 9457**.
* **Modo Offline / Fallback Integrado:** Possibilidade de execução da interface em modo de demonstração via `localStorage` sem necessidade do backend ligado (controlado pela flag `VITE_USE_LOCAL_FALLBACK`).

---

## 5. Licença

Este projeto é desenvolvido para fins acadêmicos e institucionais vinculados ao **Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB)**.
