# US 11 - Autenticação JWT, Perfis RBAC, Revogação de Sessão (Task #50), Criptografia AES-256 (Task #51) e Matriz de Autorização Granular (Task #52)

Este diretório contém as coleções Postman e scripts de teste automatizado para validação dos Critérios de Aceite da **US 11** (**TA11.1, TA11.2, TA11.3, TA11.4 e TA3.2**). A massa de dados (seed) dos usuários e perfis RBAC encontra-se consolidada em [`database/inserts/01_seed_us11_rbac.sql`](../../database/inserts/01_seed_us11_rbac.sql).

---

## 👥 Matriz de Usuários e Permissões Granulares (Task #52 - TA11.3 / TA3.2)

| Nome | E-mail | Senha | Role | Nível de Restrição | Autorização Saúde | Laudos Cifrados (TA11.2) | Dados Socioemocionais (TA11.3) | PEI Anexos Sensíveis (TA3.2) |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Administrador (Saúde)** | `admin@sigi.ifpb.edu.br` | `senha123` | `ADMIN` | `SUPER_RESTRICAO` | Sim (`true`) | ✅ **200 OK** | ✅ **200 OK** (Exibe) | ✅ **200 OK** |
| **Coordenador Geral** | `coordenador@sigi.ifpb.edu.br` | `senha123` | `COORDENADOR` | `SUPER_RESTRICAO` | Não (`false`) | ❌ **403 Forbidden** | ✅ **200 OK** (Exibe) | ✅ **200 OK** |
| **Psicopedagoga CLAI** | `psicopedagogo@sigi.ifpb.edu.br` | `senha123` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | Sim (`true`) | ❌ **403 Forbidden** | ✅ **200 OK** (Exibe) | ✅ **200 OK** |
| **Professor Titular** | `professor@sigi.ifpb.edu.br` | `senha123` | `PROFESSOR` | `ACESSO_FUNCIONAL` | Não (`false`) | ❌ **403 Forbidden** | 🛡️ **Omitido no JSON** / **403 na Rota Direta** | ❌ **403 Forbidden** |
| **Aluno Apoiador** | `aluno.apoiador@sigi.ifpb.edu.br` | `senha123` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | Não (`false`) | ❌ **403 Forbidden** | 🛡️ **Omitido no JSON** / **403 na Rota Direta** | ❌ **403 Forbidden** |

---

## 🚀 Endpoints Implementados

| Método | Rota | Perfil Requerido | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica e emite o token JWT com claims de RBAC, nível de restrição e `tokenVersion`. |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna os dados do usuário e authorities ativas no `SecurityContextHolder`. |
| `PATCH` | `/api/v1/admin/usuarios/{id}/revogar-acesso` | `ADMIN` | **TA11.4**: Invalida imediatamente qualquer JWT anterior (`token_version++`) e desativa o vínculo (`acesso_ativo=false`). |
| `POST` | `/api/v1/estudantes/{id}/anexos` | Autenticado | **TA11.1**: Recebe `MultipartFile` e `classificacao`. Cifra automaticamente com `AES/GCM/NoPadding` (256 bits) anexos `LAUDO_MEDICO` e `DIAGNOSTICO_NEUROPSICOLOGICO`. |
| `GET` | `/api/v1/estudantes/{id}/anexos` | Autenticado | Lista os metadados dos anexos do estudante (sem expor caminho físico ou IV). |
| `GET` | `/api/v1/anexos/{anexoId}/download` | `SUPER_RESTRICAO` + `autorizacaoSaude=true` *(para laudos)* | **TA11.2 / TA3.2**: Valida permissão estrita de saúde, descriptografa exclusivamente em memória e retorna o arquivo original. |
| `GET` | `/api/v1/estudantes/{id}/prontuario` | Autenticado | **TA11.3**: Prontuário unificado consolidado com omissão condicional (`@JsonInclude(NON_NULL)`) de histórico familiar/socioemocional para Professor. |
| `GET` | `/api/v1/estudantes/{id}/historico-socioemocional` | `RESTRICAO_MODERADA` ou superior | **TA11.3**: Rota direta de detalhes socioemocionais protegida por `@PreAuthorize`. Bloqueia Professor com HTTP 403. |
| `GET` | `/api/peis/{id}/anexos-sensiveis` | `RESTRICAO_MODERADA` ou superior | **TA3.2**: Anexos sensíveis do PEI protegidos por `@PreAuthorize`. Bloqueia Professor com HTTP 403. |

---

## 🧪 Como Executar os Scripts de Validação

### 0. Preparar a Massa de Dados no Banco (Seeds)
```bash
# Exemplo via psql (a partir de app/backend):
psql -U postgres -d sigi_clai -f database/inserts/01_seed_us11_rbac.sql
psql -U postgres -d sigi_clai -f database/inserts/02_seed_us02_estudo_caso.sql
psql -U postgres -d sigi_clai -f database/inserts/03_seed_us03_planejamento_pedagogico.sql
```

### 1. Validação da Task #52 (Matriz de Autorização Granular - TA11.3 e TA3.2)
```powershell
powershell -File app/backend/collection/US11/test_matriz_granular.ps1
```

### 2. Validação da Task #51 (Criptografia AES-256-GCM e Controle de Acesso de Saúde)
```powershell
powershell -File app/backend/collection/US11/test_criptografia_anexos.ps1
```

### 3. Validação da Task #50 (Autenticação, RBAC e Revogação de Sessão)
```powershell
powershell -File app/backend/collection/US11/test_revogacao_sessao.ps1
```

---

## 📮 Como Usar a Coleção no Postman

1. No Postman, clique em **Import**.
2. Selecione os dois arquivos deste diretório:
   - `SIGI_US11_Autenticacao_RBAC.postman_collection.json`
   - `SIGI_US11_Environment.postman_environment.json`
3. No canto superior direito do Postman, selecione o ambiente **SIGI - US11 Environment**.
4. A coleção agora possui a pasta **`5. Matriz de Autorização Granular (TA11.3 / TA3.2 - Task #52)`**, com testes automatizados pré-configurados para verificar os status codes (`200 OK` vs. `403 Forbidden`) e a presença/ausência de chaves sensíveis no JSON.



