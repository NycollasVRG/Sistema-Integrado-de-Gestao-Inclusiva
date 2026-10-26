# SIGI / CLAI — Banco de Dados (PostgreSQL)

Repositório consolidado de scripts **DDL** (criação de schema, tabelas, constraints e índices) e **DML** (cargas iniciais e seeds de teste) do **Sistema Integrado de Gestão Inclusiva (SIGI / CLAI)**, 100% alinhado com o domínio JPA (`com.br.CLAI.domain`) do backend Spring Boot.

---

## 📁 Estrutura de Diretórios

```text
database/
├── schema/       # Scripts de criação de tabelas, alterações e constraints (DDL)
│   ├── 01_create_tables.sql
│   └── 02_alter_tables_constraints.sql
├── inserts/      # Scripts de população de dados iniciais e seeds de teste (DML)
│   ├── 01_seed_us11_rbac.sql
│   ├── 02_seed_us02_estudo_caso.sql
│   └── 03_seed_us03_planejamento_pedagogico.sql
└── README.md     # Guia atualizado de execução na ordem correta
```

---

## 🗄️ Descrição dos Arquivos

### 1. `database/schema/` (DDL — Estrutura e Regras de Integridade)

| Ordem | Arquivo | Propósito |
| :---: | :--- | :--- |
| **1** | [`schema/01_create_tables.sql`](schema/01_create_tables.sql) | Cria o schema `sigi` e todas as **10 tabelas** exigidas pelas entidades do domínio Java (`usuario`, `aluno`, `indicador_reutilizavel`, `estudo_de_caso`, `estudo_caso_indicador`, `acompanhamento`, `plano_acao`, `pei`, `pea`, `anexo_estudante`), incluindo chaves estrangeiras, `UUID` nativo, coluna sintética de exclusão lógica (`deleted` via `@SoftDelete`) e auditoria (`criado_em`, `atualizado_em`, `criado_por`, `atualizado_por`). |
| **2** | [`schema/02_alter_tables_constraints.sql`](schema/02_alter_tables_constraints.sql) | Garante de forma idempotente as colunas de histórico sensível (`historico_familiar` e `historico_socioemocional` - **TA11.3**), cria o índice parcial único que impede dois estudos de caso ativos simultâneos por aluno (`idx_estudo_caso_ativo` - **TA2.4**), cria índices de busca/performance para autenticação RBAC, anexos cifrados e Timeline (**US 09**), e registra os comentários de metadados LGPD. |

### 2. `database/inserts/` (DML — Cargas de Dados e Seeds de Teste)

Todos os scripts de seed utilizam `ON CONFLICT DO NOTHING`, podendo ser executados repetidas vezes e em sequência no mesmo banco sem gerar conflitos de chave primária ou constraints `UNIQUE`.

| Ordem | Arquivo | Propósito |
| :---: | :--- | :--- |
| **1** | [`inserts/01_seed_us11_rbac.sql`](inserts/01_seed_us11_rbac.sql) | Insere os **5 usuários base de autenticação e RBAC** (`ADMIN`, `ALUNO_APOIADOR`, `COORDENADOR`, `CLAI_PSICOPEDAGOGO`, `PROFESSOR`) com senhas criptografadas em BCrypt (`senha123`), níveis de restrição (`SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL`), flag de sigilo médico (`autorizacao_saude`) e controle de versão de sessão (`token_version`). |
| **2** | [`inserts/02_seed_us02_estudo_caso.sql`](inserts/02_seed_us02_estudo_caso.sql) | Insere os **2 alunos base de teste** (`MAT-TEST-001` e `MAT-TEST-002`) e os **3 indicadores reutilizáveis** (`Dificuldade de Leitura`, `TDAH`, `Discalculia`) utilizados pelas coleções da **US 02**, **US 09** e **US 11**. |
| **3** | [`inserts/03_seed_us03_planejamento_pedagogico.sql`](inserts/03_seed_us03_planejamento_pedagogico.sql) | Garante os alunos base e insere os **2 registros de `acompanhamento`** que servem de ponte obrigatória para os testes de **PEA**, **PEI** e **Plano de Ação** da **US 03**. |

---

## 🚀 Como Executar (Ordem Exata no PostgreSQL)

### Opção 1: Via Terminal (`psql`)

A partir do diretório `app/backend/`, execute os scripts na seguinte ordem:

```bash
# 1. Criar o banco de dados (caso ainda não exista)
psql -U postgres -c "CREATE DATABASE sigi_clai;"

# 2. Subir a estrutura (DDL - Schema, Tabelas, Constraints e Índices)
psql -U postgres -d sigi_clai -f database/schema/01_create_tables.sql
psql -U postgres -d sigi_clai -f database/schema/02_alter_tables_constraints.sql

# 3. Popular o banco com os dados iniciais e seeds de teste (DML)
psql -U postgres -d sigi_clai -f database/inserts/01_seed_us11_rbac.sql
psql -U postgres -d sigi_clai -f database/inserts/02_seed_us02_estudo_caso.sql
psql -U postgres -d sigi_clai -f database/inserts/03_seed_us03_planejamento_pedagogico.sql
```

### Opção 2: Via Cliente Gráfico (pgAdmin 4 / DBeaver / IntelliJ Database Tools)

1. Conecte-se ao servidor PostgreSQL e selecione o banco `sigi_clai`.
2. Abra o **Query Tool / SQL Editor** e execute na ordem:
   1. `database/schema/01_create_tables.sql`
   2. `database/schema/02_alter_tables_constraints.sql`
   3. `database/inserts/01_seed_us11_rbac.sql`
   4. `database/inserts/02_seed_us02_estudo_caso.sql`
   5. `database/inserts/03_seed_us03_planejamento_pedagogico.sql`

### Opção 3: Via Docker Compose (Inicialização Automática)

O arquivo [`docker-compose.yml`](../../docker-compose.yml) na raiz do projeto está pré-configurado para montar e aplicar os scripts automaticamente na ordem correta em `/docker-entrypoint-initdb.d/` na primeira inicialização do container `sigi-db`:

```bash
# Na raiz do projeto:
docker compose up -d db
```

---

## 🔍 Consultas de Verificação Pós-Execução

```sql
-- 1. Verificar todas as tabelas criadas no schema sigi
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'sigi'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar índices criados no schema sigi
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'sigi'
ORDER BY tablename, indexname;

-- 3. Conferir contagem dos registros inseridos pelos seeds
SELECT
    (SELECT COUNT(*) FROM sigi.usuario) AS total_usuarios,
    (SELECT COUNT(*) FROM sigi.aluno) AS total_alunos,
    (SELECT COUNT(*) FROM sigi.indicador_reutilizavel) AS total_indicadores,
    (SELECT COUNT(*) FROM sigi.acompanhamento) AS total_acompanhamentos;
```
