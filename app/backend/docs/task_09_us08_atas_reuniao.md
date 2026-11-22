# Task 09 – US 08: Gestão e Acompanhamento de Atas de Reunião

## Visão Geral

Implementa o módulo completo de **Atas de Reunião** no backend (`com.br.CLAI`) para formalização de reuniões pedagógicas e de alinhamento com famílias, atendendo aos critérios **TA8.1**, **TA8.2**, **TA8.3**, **TA8.4** e alimentando a **Linha do Tempo do Estudante (US 09 / TA9.2)** e o futuro **Dossiê Jurídico (US 06)**.

---

## Banco de Dados (`V11__create_ata_reuniao.sql`)

| Tabela / Alteração | Descrição |
|---|---|
| `sigi.ata_reuniao` | Registro da ata vinculada ao estudante (`aluno_id`), tipo (`PEDAGOGICA` / `ALINHAMENTO_FAMILIA`), pauta, deliberações, status (`RASCUNHO` / `FINALIZADA`) e metadados do documento assinado cifrado (`documento_*`). |
| `sigi.ata_assinatura` | Registro auditável de assinaturas digitais coletadas dos participantes (nome, papel, usuário opcional, timestamp, IP de origem e hash SHA-256 do conteúdo assinado). |
| `sigi.ata_compromisso` | Compromissos e prazos acordados na ata, vinculados ao responsável (`responsavel_id` em `sigi.usuario`), status (`PENDENTE` / `CONCLUIDO`) e `lembrete_enviado_em` para idempotência do job agendado. |
| `sigi.ata_termo_aditivo` | Termos aditivos explicativos anexados a atas `FINALIZADAS`, preservando a imutabilidade da ata original. |
| `sigi.notificacao` *(ALTER)* | Nova coluna opcional `usuario_destinatario_id` (FK para `sigi.usuario`) para lembretes individuais sem vazamento nas consultas genéricas por perfil. |

---

## Endpoints (`/api/atas` e `/api/notificacoes`)

| Método e Rota | Permissão (RBAC) | Comportamento |
|---|---|---|
| `POST /api/atas` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Cria ata em `RASCUNHO` com compromissos opcionais (`201 Created`). |
| `GET /api/atas/{id}` | Autenticado | Consulta ata completa (assinaturas, compromissos e termos aditivos). |
| `GET /api/atas/aluno/{alunoId}` | Autenticado | Lista atas do estudante ordenadas por criação decrescente. |
| `PUT /api/atas/{id}` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Atualiza ata em `RASCUNHO`. Retorna **HTTP 409 (`application/problem+json`, RFC 9457)** se `status == FINALIZADA` (TA8.4). |
| `POST /api/atas/{id}/documento-assinado` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Upload multipart (`arquivo`/`file`, PDF/PNG/JPEG) cifrado em repouso com AES-256-GCM via `CryptoStorageService` (TA8.1). |
| `GET /api/atas/{id}/documento-assinado` | Autenticado | Download do documento assinado descriptografado em memória (`Cache-Control: no-store`). |
| `POST /api/atas/{id}/assinaturas` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Coleta assinaturas digitais auditáveis com cálculo de hash SHA-256 canônico (TA8.1). |
| `POST /api/atas/{id}/finalizar` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Finaliza a ata exigindo documento assinado ou ≥1 assinatura digital íntegra (TA8.1 / TA8.4). |
| `POST /api/atas/{id}/termos-aditivos` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Emite termo aditivo explicativo para ata `FINALIZADA` (`201 Created`, TA8.4). |
| `GET /api/atas/{id}/termos-aditivos` | Autenticado | Lista termos aditivos da ata em ordem cronológica. |
| `PATCH /api/atas/{id}/compromissos/{compromissoId}/concluir` | `@rbacGuard.temRestricaoModeradaOuSuperior()` | Marca compromisso como `CONCLUIDO` (permitido em atas finalizadas). |
| `GET /api/notificacoes/minhas` | Autenticado | Lista notificações individuais do usuário autenticado (TA8.3). |

---

## Integrações

- **Timeline (TA8.2 / TA9.2):** `TimelineService` agrega `AtaReuniaoRepository.findByAlunoId(alunoId)` emitindo eventos com `tipo = "ATA"` em `GET /api/alunos/{alunoId}/timeline`.
- **Job `@Scheduled` (TA8.3):** `AtaLembreteJob` (habilitado via `@EnableScheduling` em `ClaiApplication`) executa `AtaCompromissoLembreteService.enviarLembretes()` diariamente às 08:00 (`America/Fortaleza`), configurável via `sigi.atas.lembrete.*`.
