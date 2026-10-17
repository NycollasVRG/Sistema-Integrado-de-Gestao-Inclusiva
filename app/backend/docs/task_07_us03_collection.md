# Plano de Implementação: Collection de PEA e PEI (US 03)

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Configuração de Soft Delete na `BaseEntity` (`@SoftDelete` do Hibernate).
- [x] Estrutura de auditoria com `criadoEm`, `atualizadoEm`, `criadoPor` e `atualizadoPor`.
- [x] Implementação das entidades de domínio: `Aluno`, `Acompanhamento`, `PlanoAcao`, `Pea` e `Pei`.
- [x] CRUD completo de PEA e PEI (DTOs, Mappers, Repositories, Services e Controllers) — ver `task_05_implementacao_crud_pea_pei.md`.
- [x] Regra do TA3.2: rota de anexos sensíveis do PEI com bloqueio do perfil `Professor` (HTTP 403).
- [x] Regra do TA3.4: exclusão lógica de PEA e PEI.
- [x] Coleção de testes da US 02 como referência de padrão (`collection/US02`).

**O que foi feito nesta Task (Checkpoint Atual):**
- [x] Análise dos testes de aceite da US 03 e das lacunas existentes no modelo atual.
- [x] Criação da pasta `collection/US03` com collection Postman, environment, seed SQL e README.
- [x] Documentação do fluxo detalhado de PEA e PEI cobrindo TA3.1, TA3.2 e TA3.4.

## 2. Análise dos Testes de Aceite

| Teste | Status | Como foi coberto |
|---|---|---|
| **TA3.1** - Formulário do PEI carrega dados institucionais (Matrícula, Turma e Curso) | **Parcial** | A coleção valida o vínculo automático `Aluno → Acompanhamento → PEI`: o cliente envia apenas o `acompanhamentoId` e o `alunoId` é resolvido pelo banco (cenários 2.1 e 2.2). Matrícula/Turma/Curso ficam pendentes (ver seção 3). |
| **TA3.2** - Professor regente recebe 403 em anexos sensíveis | **Total** | Cenários 2.13 (200 sem perfil), 2.14 (200 Coordenador) e 2.15 (**403** Professor, título `Acesso Negado`). |
| **TA3.3** - Notificação de RAI bimestral com regressão | **Fora do escopo** | Excluído pelo critério de aceite da US 03 por depender de funcionalidades de Sprints futuras (módulo de RAI e notificações). |
| **TA3.4** - Soft delete sem cascata | **Total** | Cenários 2.16 (204), 2.17 (404 após exclusão), 2.18 (PEAs/Aluno/Acompanhamento preservados) e 2.19 (404 para ID inexistente), mais validação SQL manual documentada no README. |

## 3. Lacunas Identificadas no Modelo Atual

### 3.1 TA3.1 - Matrícula, Turma e Curso
O estado atual do banco e da API não sustenta o critério completo:

- `PeiResponseDTO` expõe apenas `id`, `acompanhamentoId`, `alunoId`, campos textuais e auditoria — **não** retorna matrícula.
- Não existe `AlunoController` (nenhum endpoint consulta dados do aluno).
- Não existem entidades `Turma` e `Curso` no `create_tables.sql`.

**Decisão (aprovada):** cobrir na coleção apenas o que existe hoje (vínculo automático do aluno) e documentar a pendência no README. O escopo futuro para fechar o TA3.1 integralmente:

1. Criar entidades `Curso` e `Turma` (com FK para o aluno/matrícula).
2. Criar `GET /api/alunos/{id}` retornando `nome`, `matricula`, `turma` e `curso`.
3. Estender `PeiResponseDTO` com os dados institucionais resolvidos no Mapper.

### 3.2 Sem endpoint de Acompanhamento/PlanoAcao
`Acompanhamento` é obrigatório para criar PEI/PEA (`@NotNull no `acompanhamentoId`), mas não há controller para criá-lo. O seed (`seed_test_data.sql`) insere os acompanhamentos diretamente no PostgreSQL — mesmo padrão adotado pelo seed da US 02.

### 3.3 PlanoAcao
A story descreve o PEI como "derivado do Plano de Ação", porém no modelo atual `Pei` e `PlanoAcao` apenas compartilham o mesmo `Acompanhamento` — não há referência direta nem endpoint de Plano de Ação. O seed não inclui `plano_acao` por não haver nenhuma requisição capaz de exercitá-lo.

## 4. Estrutura da Entrega

```
app/backend/
├── docs/
│   └── task_07_us03_collection.md            ← este documento
└── collection/
    ├── US02/                                 ← referência (já existente)
    └── US03/
        ├── SIGI_PlanejamentoPedagogico.postman_collection.json
        ├── SIGI_Environment.postman_environment.json
        ├── seed_test_data.sql
        └── README.md
```

A collection é **um único arquivo** com duas pastas, seguindo a numeração do US 02:

```text
SIGI - US 03 Plano de Ensino Individualizado (PEI/PEA)
 ├── 1. PEA - Plano de Ensino Adaptado        (1.1 a 1.12)
 └── 2. PEI - Plano de Ensino Individualizado (2.1 a 2.19)
```

A pasta PEA roda **antes** da PEI porque cria os registros usados como anexos sensíveis nos cenários 2.13 a 2.15.

## 5. Fluxo Detalhado

### 5.1 Pasta 1 - PEA (12 requisições)

| # | Método/Endpoint | Cenário | Esperado |
|---|---|---|---|
| 1.1 | `POST /api/peas` | Criar PEA com sucesso; asserção de que `alunoId` vem derivado do acompanhamento | `201` + salva `peaId` |
| 1.2 | `POST /api/peas` | Criar 2º PEA (mesmo acompanhamento) para compor a lista de anexos | `201` + salva `peaId2` |
| 1.3 | `POST /api/peas` | Sem `objetivoGeral` | `400` RFC 9457 |
| 1.4 | `POST /api/peas` | Acompanhamento inexistente | `404` RFC 9457 |
| 1.5 | `GET /api/peas/aluno/{alunoId}` | Listar por aluno | `200` array ≥ 1 |
| 1.6 | `GET /api/peas/acompanhamento/{id}` | Listar por acompanhamento | `200` array ≥ 2 |
| 1.7 | `GET /api/peas/{peaId}` | Buscar por ID | `200` |
| 1.8 | `GET /api/peas/00000000-...` | ID inexistente | `404` RFC 9457 |
| 1.9 | `PUT /api/peas/{peaId}` | Atualizar campos pedagógicos | `200` + auditoria |
| 1.10 | `PUT /api/peas/00000000-...` | Atualizar inexistente | `404` |
| 1.11 | `DELETE /api/peas/{peaId}` | Soft delete | `204` |
| 1.12 | `GET /api/peas/{peaId}` | Confirmar invisibilidade pós-delete | `404` |

### 5.2 Pasta 2 - PEI (19 requisições)

| # | Método/Endpoint | Cenário | Esperado | TA |
|---|---|---|---|---|
| 2.1 | `POST /api/peis` | Criar PEI; `alunoId` derivado automaticamente | `201` | TA3.1 |
| 2.2 | `GET /api/peis/{peiId}` | Dados institucionais presentes sem reenvio pelo cliente | `200` | TA3.1 |
| 2.3 | `POST /api/peis` | Sem `habilidadesInteresses` | `400` | Validação |
| 2.4 | `POST /api/peis` | Sem `propostasAdaptacoes` | `400` | Validação |
| 2.5 | `POST /api/peis` | Sem `acompanhamentoId` | `400` | Validação |
| 2.6 | `POST /api/peis` | Acompanhamento inexistente | `404` | Validação |
| 2.7 | `GET /api/peis/aluno/{alunoId}` | Listar por aluno | `200` array ≥ 1 | — |
| 2.8 | `GET /api/peis/aluno/{aluno2Id}` | Aluno sem PEI (isolamento) | `200` array vazio | — |
| 2.9 | `GET /api/peis/acompanhamento/{id}` | Listar por acompanhamento | `200` | — |
| 2.10 | `GET /api/peis/00000000-...` | ID inexistente | `404` RFC 9457 | — |
| 2.11 | `PUT /api/peis/{peiId}` | Atualização parcial | `200` | — |
| 2.12 | `PUT /api/peis/00000000-...` | Atualizar inexistente | `404` | — |
| 2.13 | `GET /api/peis/{id}/anexos-sensiveis` | Sem header `X-User-Perfil` | `200` | TA3.2 |
| 2.14 | `GET /api/peis/{id}/anexos-sensiveis` | `X-User-Perfil: Coordenador` | `200` | TA3.2 |
| 2.15 | `GET /api/peis/{id}/anexos-sensiveis` | `X-User-Perfil: Professor` | **`403`** | **TA3.2** |
| 2.16 | `DELETE /api/peis/{peiId}` | Soft delete | `204` | TA3.4 |
| 2.17 | `GET /api/peis/{peiId}` | Invisível após delete | `404` | TA3.4 |
| 2.18 | `GET /api/peas/aluno/{alunoId}` | Registros relacionados preservados (sem cascata) | `200` array ≥ 1 | TA3.4 |
| 2.19 | `DELETE /api/peis/00000000-...` | Excluir inexistente | `404` | — |

### 5.3 Sequência principal (happy path)

```text
seed (SQL)          POST /api/peas (1.1, 1.2)
    ↓                        ↓
aluno + acompanhamento   PEA criado (peaId, peaId2)
                             ↓
                     POST /api/peis (2.1)  ← envia só acompanhamentoId
                             ↓
               GET /api/peis/{id} (2.2)    ← TA3.1: alunoId automático
                             ↓
        GET .../anexos-sensiveis (2.13/2.14/2.15) ← TA3.2: Professor = 403
                             ↓
        DELETE /api/peis/{id} (2.16) → GET (2.17) ← TA3.4: soft delete
                             ↓
        GET /api/peas/aluno/{id} (2.18)   ← TA3.4: sem cascata
```

## 6. Seed de Dados

Script idempotente (`ON CONFLICT DO NOTHING`), reutilizando os UUIDs da US 02:

| Tabela | UUID | Descrição |
|---|---|---|
| `sigi.aluno` | `11111111-1111-1111-1111-111111111111` | Aluno do fluxo completo |
| `sigi.aluno` | `22222222-2222-2222-2222-222222222222` | Aluno de isolamento (sem PEI) |
| `sigi.acompanhamento` | `33333333-3333-3333-3333-333333333333` | Acompanhamento do aluno 1 (PEA + PEI) |
| `sigi.acompanhamento` | `44444444-4444-4444-4444-444444444444` | Acompanhamento do aluno 2 |

## 7. Variáveis de Ambiente

- **Fixas:** `baseUrl`, `alunoId`, `aluno2Id`, `acompanhamentoId`, `acompanhamento2Id`, `usuarioId`, `idInexistente`.
- **Runtime (salvas pelas asserções):** `peaId` (1.1), `peaId2` (1.2), `peiId` (2.1).

## 8. Padrões Adotados (herdados do US 02)

- Asserções de status + estrutura RFC 9457 (`title`, `status`, `detail`) em toda resposta de erro.
- Mensagens de validação conferidas caractere a caractere com os `@NotBlank/@NotNull` dos DTOs e com as exceções de serviço (incluindo acentuação).
- Header `X-User-Id` obrigatório em POST/PUT/DELETE (auditoria `criadoPor`/`atualizadoPor`).
- Header `X-User-Perfil` apenas nos cenários de anexos sensíveis.
- Captura de IDs em variáveis de ambiente para encadear os cenários.

## 9. Instruções de Execução

```bash
# 1. Banco de dados
psql -U postgres -d sigi_clai -f collection/US03/seed_test_data.sql

# 2. Aplicação
./mvnw spring-boot:run

# 3. Testes automatizados (Newman)
npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json \
  -e collection/US03/SIGI_Environment.postman_environment.json
```

Detalhes completos em `collection/US03/README.md`.

## 10. Critérios de Aceite da Task

- [x] Cobertura validando **TA3.1** (na limitação aprovada: vínculo automático do aluno; matrícula/turma/curso documentados como pendência).
- [x] Cobertura validando **TA3.2** (403 para Professor; 200 para demais perfis).
- [x] Cobertura validando **TA3.4** (soft delete sem cascata, via API e SQL manual).
- [x] **TA3.3** explicitamente fora do escopo (depende de Sprints futuras).

## 11. Próximos Passos (Trabalhos Futuros)

1. **TA3.1 completo:** modelar `Curso`/`Turma`, criar `GET /api/alunos/{id}` e enriquecer `PeiResponseDTO`.
2. **TA3.3:** implementar o módulo de RAI bimestral e a notificação ao Coordenador, criando a pasta `collection/US03-rai` (ou equivalente) quando o endpoint existir.
3. **Endpoint de Acompanhamento/PlanoAcao:** substituir as linhas do seed por requisições reais quando os controllers forem implementados.
4. Automatizar a verificação SQL do TA3.4 (seção do README) em um passo de pós-execução do Newman.
