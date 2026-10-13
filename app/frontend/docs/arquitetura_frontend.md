# Arquitetura do Frontend — SIGI / CLAI (IFPB Sousa)

Documento técnico gerado a partir da análise da base de código localizada em `app/frontend/`.
Descreve a stack, a estrutura de diretórios, os padrões adotados, o gerenciamento de estado e a
integração com a API REST (backend Spring Boot).

---

## 1. Visão Geral

O frontend é uma aplicação **Single Page Application (SPA)** construída com **React 19 + TypeScript + Vite**.
Ela implementa a interface da **Equipe Multidisciplinar** do **Sistema Integrado de Gestão Inclusiva (SIGI)**,
especificamente o fluxo de **Estudo de Caso** da Coordenação Local de Acessibilidade e Inclusão (CLAI) do
Campus Sousa.

O recorte funcional documentado corresponde à **US 02 / Task #4**, contemplando:

- Seleção de aluno em atendimento e exibição da ficha do estudante.
- Criação, edição, salvamento de rascunho e conclusão de Estudo de Caso.
- Indicadores reutilizáveis (tags de dificuldades/barreiras).
- Bloqueio de criação do Plano de Ação enquanto o Estudo de Caso estiver Pendente/Rascunho (**TA2.1**).
- Validação de front que impede conclusão sem Diagnóstico e ao menos um indicador (**TA2.3**).

O backend é uma aplicação Spring Boot que expõe a API em `/api`, acessada via proxy do Vite durante o
desenvolvimento.

---

## 2. Stack de Tecnologias

| Categoria | Tecnologia | Versão (package.json) | Papel |
|---|---|---|---|
| Biblioteca de UI | `react` | ^19.2.8 | Construção de interfaces declarativas |
| DOM | `react-dom` | ^19.2.8 | Renderização no navegador (via `createRoot`) |
| Linguagem | `typescript` | ~6.0.2 | Tipagem estática |
| Build/Dev Server | `vite` | ^8.3.0 | Bundler, HMR e servidor de desenvolvimento |
| Plugin React | `@vitejs/plugin-react` | ^6.1.1 | Fast Refresh / transformação JSX |
| Estilização | `tailwindcss` | ^3.4.19 | Utility-first CSS |
| Pós-processamento | `postcss`, `autoprefixer` | ^8.5.29 / ^10.6.1 | Pipeline de CSS |
| Ícones | `lucide-react` | ^1.55.0 | Biblioteca de ícones (SVG) |
| Linter | `oxlint` | ^1.81.0 | Lint rápido (regras de hooks e export) |
| Tipos Node | `@types/node` | ^24.13.3 | Tipagem para configs Node (`vite.config.ts`) |

**Observações relevantes:**

- O template base é o oficial **React + TypeScript + Vite** (ver `README.md`).
- O **React Compiler não está habilitado**.
- Não há biblioteca de rotas (React Router), de estado global (Redux/Zustand) ou de requisições
  (Axios/React Query). A navegação é feita por **estado interno** e o HTTP pelo **Fetch API nativo**.

---

## 3. Estrutura de Diretórios

```
app/frontend/
├── index.html                  # HTML raiz; monta o app em <div id="root">
├── package.json                # Dependências e scripts (dev/build/lint/preview)
├── vite.config.ts              # Config do Vite + proxy /api → localhost:8080
├── tailwind.config.js          # Tema e paleta institucional IFPB
├── postcss.config.js           # Plugins Tailwind + Autoprefixer
├── tsconfig.json               # Agrega os tsconfigs (app + node)
├── tsconfig.app.json           # Config TS do código-fonte (src)
├── tsconfig.node.json          # Config TS para vite.config.ts
├── .oxlintrc.json              # Regras do linter
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx                # Ponto de entrada; StrictMode + createRoot
    ├── App.tsx                 # Componente raiz; estado global e orquestração
    ├── index.css               # Diretivas Tailwind + estilos base (fontes/cores)
    ├── App.css                 # CSS legado do template (não referenciado no fluxo atual)
    ├── types/
    │   └── estudoDeCaso.ts     # Tipos e DTOs (domínio Estudo de Caso)
    ├── services/
    │   └── estudoDeCasoService.ts  # Camada de acesso à API + fallback local
    ├── components/
    │   ├── HeaderIFPB.tsx      # Cabeçalho institucional + breadcrumb + busca
    │   ├── TelaAluno.tsx       # Ficha do aluno e status do estudo + ação Plano de Ação
    │   ├── FormularioEstudoDeCaso.tsx  # Formulário de criação/edição/conclusão
    │   ├── ToastAlert.tsx      # Notificações flutuantes (sucesso/erro/alerta)
    │   └── VLibrasButton.tsx   # Botão de acessibilidade em Libras
    └── assets/
        ├── hero.png
        ├── react.svg
        └── vite.svg
```

### Propósito dos módulos

| Módulo | Responsabilidade |
|---|---|
| `src/App.tsx` | **Container/orquestrador**. Mantém o estado global (aluno selecionado, estudo atual, visualização, loading, toasts), define os handlers de negócio e compõe as telas. |
| `src/components/` | Componentes de apresentação (presentational), recebem dados e callbacks via `props`. Sem chamadas HTTP diretas. |
| `src/services/` | Encapsula o acesso ao backend e a estratégia de fallback local (`localStorage`). |
| `src/types/` | Contratos de dados (interfaces/DTOs) compartilhados entre telas e serviço. |
| `src/assets/` | Recursos estáticos importáveis pelo bundler. |
| `public/` | Arquivos servidos na raiz (favicons, SVGs). |

---

## 4. Arquitetura de Componentes e Padrões

### 4.1 Modelo de composição

A aplicação adota uma arquitetura em **camadas simples** com um único container de estado:

```
main.tsx
  └── App.tsx (estado + handlers + chamadas ao Service)
        ├── VLibrasButton        (apresentação pura)
        ├── ToastAlert           (apresentação pura, recebe lista de toasts)
        ├── HeaderIFPB           (apresentação pura, recebe busca/subtítulo)
        ├── TelaAluno            (apresentação; emite callbacks para App)
        └── FormularioEstudoDeCaso (apresentação + validação de formulário local)
```

- **Estado "lifting up"**: todo o estado relevante vive em `App.tsx` e desce por `props`.
- **Fluxo de dados unidirecional**: eventos sobem via callbacks (`onSalvarRascunho`, `onConcluir`,
  `onExcluirRascunho`, `onSelecionarAluno`, etc.).
- **Componentes de apresentação** não conhecem a API; apenas `App` e o `Service` fazem I/O.

### 4.2 Padrões de nomenclatura

| Elemento | Convenção | Exemplos |
|---|---|---|
| Componentes | `PascalCase`, arquivo homônimo | `TelaAluno.tsx`, `HeaderIFPB.tsx` |
| Interfaces de props | `NomeDoComponenteProps` | `TelaAlunoProps`, `HeaderIFPBProps` |
| Handlers no container | prefixo `handle` | `handleSalvarRascunho`, `handleConcluir`, `handleExcluirRascunho` |
| Callbacks em props | prefixo `on` | `onAbrirFormularioEstudo`, `onCriarPlanoAcao`, `onFechar` |
| Serviço | classe `static` com métodos CRUD | `EstudoDeCasoService.listarPorAluno` |
| Constantes de mock | `*_PADRAO` | `ALUNOS_PADRAO`, `INDICADORES_PADRAO` |
| Tipos/DTOs | sufixos `RequestDTO` / `ResponseDTO` | `EstudoDeCasoRequestDTO` |
| Funções internas | `camelCase` | `carregarEstudosDoAluno`, `toggleIndicador` |
| Domínio (status) | `UPPER_SNAKE` em união de strings | `'ATIVO' \| 'ENCERRADO' \| 'RASCUNHO'` |

### 4.3 Convenções de código

- Componentes tipados como `React.FC<Props>` com `export` nomeado (+ `export default App` no raiz).
- Importação de tipos com `import type` (exigido por `verbatimModuleSyntax`).
- TypeScript em modo **bundler**, `noEmit`, `noUnusedLocals`, `noUnusedParameters` e `erasableSyntaxOnly`.
- Sem comentários no código-fonte, exceto os explicativos de regra de negócio (TA2.1/TA2.3).

---

## 5. Gerenciamento de Estado

Não há biblioteca de estado global. O estado é gerenciado por **React Hooks** dentro de `App.tsx`.

### 5.1 Estado global (`App.tsx`)

| Estado | Tipo | Propósito |
|---|---|---|
| `alunos` | `Aluno[]` | Lista de alunos (constante `ALUNOS_PADRAO`) |
| `alunoSelecionado` | `Aluno` | Aluno em atendimento |
| `indicadores` | `IndicadorReutilizavel[]` | Catálogo de indicadores (constante `INDICADORES_PADRAO`) |
| `estudoAtual` | `EstudoDeCasoResponseDTO \| null` | Estudo de caso carregado/atual |
| `visualizacao` | `'TELA_ALUNO' \| 'FORMULARIO_ESTUDO'` | Roteamento por estado (sem router) |
| `isLoading` | `boolean` | Estado de carregamento de requisições |
| `toasts` | `ToastMessage[]` | Fila de notificações |
| `termoBusca` | `string` | Termo do campo de busca do header |

### 5.2 Estados locais (`FormularioEstudoDeCaso.tsx`)

| Estado | Tipo | Propósito |
|---|---|---|
| `diagnostico` | `string` | Texto do Diagnóstico Inicial |
| `indicadoresSelecionados` | `string[]` | IDs dos indicadores marcados |
| `erroDiagnostico` | `string \| null` | Mensagem de erro do campo de diagnóstico |
| `erroIndicadores` | `string \| null` | Mensagem de erro dos indicadores |
| `tentouConcluir` | `boolean` | Controla a exibição das validações TA2.3 |

### 5.3 Navegação (máquina de estados)

A troca de telas é feita por uma união de strings (`Visualizacao`), sem dependência de rotas:

```
TELA_ALUNO ──(onAbrirFormularioEstudo)──▶ FORMULARIO_ESTUDO
FORMULARIO_ESTUDO ──(onVoltar / onConcluir / onExcluirRascunho)──▶ TELA_ALUNO
```

### 5.4 Efeitos colaterais

`useEffect` dependente de `alunoSelecionado` dispara `carregarEstudosDoAluno(alunoSelecionado.id)`,
buscando os estudos do aluno e populando `estudoAtual` (ou `null` se não houver).

### 5.5 Notificações (Toast)

`adicionarToast(tipo, titulo, mensagem)` empilha uma mensagem com `id` único e agenda a remoção
automática após **5 segundos** via `setTimeout`. O `ToastAlert` apenas renderiza a lista.

---

## 6. Integração com a API

### 6.1 Camada de serviço

`src/services/estudoDeCasoService.ts` centraliza todo o I/O. É uma **classe com métodos estáticos**
(`EstudoDeCasoService`), usando **Fetch API** nativo.

- `baseUrl = '/api/estudos-de-caso'`
- `defaultUserId = '99999999-9999-9999-9999-999999999999'`

### 6.2 Proxy de desenvolvimento (Vite)

O `vite.config.ts` redireciona `/api` para o backend:

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      // Em caso de ECONNREFUSED, responde 503 com ProblemDetail
    },
  },
}
```

Se o Spring Boot estiver desligado, o proxy devolve **503** com um corpo `ProblemDetail`, evitando
poluir o terminal e permitindo que o fallback local do service seja acionado.

### 6.3 Endpoints consumidos

| Método | Rota | Método do Service | Cabeçalhos |
|---|---|---|---|
| GET | `/api/estudos-de-caso/{id}` | `buscarPorId(id)` | — |
| GET | `/api/estudos-de-caso/aluno/{alunoId}` | `listarPorAluno(alunoId)` | — |
| POST | `/api/estudos-de-caso` | `criar(dto, usuarioId?)` | `Content-Type`, `X-User-Id` |
| PUT | `/api/estudos-de-caso/{id}` | `atualizar(id, dto, usuarioId?)` | `Content-Type`, `X-User-Id` |
| DELETE | `/api/estudos-de-caso/{id}` | `excluir(id, usuarioId?)` | `X-User-Id` |

Essas rotas espelham o `EstudoDeCasoController` do backend Spring Boot (`@RequestMapping("/api/estudos-de-caso")`,
`@CrossOrigin(origins = "*")`). O header `X-User-Id` é opcional no backend (`required = false`).

### 6.4 Contratos de dados (`src/types/estudoDeCaso.ts`)

```ts
type StatusEstudoCaso = 'ATIVO' | 'ENCERRADO' | 'RASCUNHO';

interface EstudoDeCasoRequestDTO {
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  indicadoresIds: string[];
}

interface EstudoDeCasoUpdateDTO {
  status: StatusEstudoCaso;
  diagnosticoInicial?: string | null;
  indicadoresIds: string[];
}

interface EstudoDeCasoResponseDTO {
  id: string;
  alunoId: string;
  status: StatusEstudoCaso;
  diagnosticoInicial: string | null;
  indicadoresIds: string[];
  criadoEm?: string;
  atualizadoEm?: string;
}
```

### 6.5 Tratamento de erros — Problem Details (RFC 9457)

Os erros de negócio usam o padrão **RFC 9457** (`application/problem+json`):

```ts
interface ProblemDetailRFC9457 {
  title: string;
  status: number;
  detail: string;
  instance?: string;
}
```

Nos handlers de `App.tsx`, a exceção é interpretada como `ProblemDetailRFC9457` e convertida em
toast: `title` como título e `detail` como mensagem. O service propaga respostas não-OK do backend
quando identificáveis (possuem `status`/`detail`), diferenciando erros de negócio de falhas de rede.

### 6.6 Estratégia de fallback local (offline-first / degradação)

Quando o backend está indisponível (`fetch` lança ou retorna erro de rede), o service passa a operar
sobre um **repositório local** persistido em `localStorage`:

- Chave: `sigi_clai_estudos_de_caso`.
- Funções: `getStoredEstudos()` e `saveStoredEstudos()`.
- O fallback também replica regras de negócio do backend:
  - Conflito: não permitir dois estudos com status `ATIVO` para o mesmo aluno.
  - Bloqueio: não permitir excluir estudo com status `ENCERRADO`.
- IDs locais gerados com `crypto.randomUUID()` (com fallback `mock-<timestamp>`).
- Escritas bem-sucedidas no backend **sincronizam o cache local**.

Esse comportamento permite testar/demonstrar a UI sem o Spring Boot em execução.

---

## 7. Regras de Negócio Refletidas no Frontend

| Regra | Local | Descrição |
|---|---|---|
| **TA2.1** | `TelaAluno.tsx` | Botão "Criar Plano de Ação" só é habilitado se o estudo estiver `ENCERRADO`/`ATIVO` (Concluído). Caso contrário, fica bloqueado com aviso. |
| **TA2.3** | `FormularioEstudoDeCaso.tsx` | "Concluir Estudo de Caso" exige Diagnóstico não vazio **e** ao menos um indicador selecionado; caso contrário, bloqueia a requisição e exibe erros por campo. |
| Rascunho parcial | `FormularioEstudoDeCaso.tsx` / `App.tsx` | "Salvar Rascunho" não exige campos completos e persiste com status `RASCUNHO`. |
| Descarte de rascunho | `App.tsx` / service | `DELETE` disponível apenas quando o status é `RASCUNHO`, com confirmação via `window.confirm`. |

Fluxo de status: `Pendente (sem estudo)` → `RASCUNHO` → `ENCERRADO`/`ATIVO` (Concluído).

---

## 8. Estilização e Design System

- **Tailwind CSS** com paleta institucional customizada em `tailwind.config.js` sob o namespace `ifpb`:

| Token | Hex | Uso |
|---|---|---|
| `ifpb-teal` | `#0F6460` | Cor primária (títulos, ações principais) |
| `ifpb-tealHover` | `#0B4F4C` | Hover da cor primária |
| `ifpb-tealLight` | `#E6F0EF` | Fundos suaves / chips selecionados |
| `ifpb-green` | `#3FA14C` | Cor secundária (links do header) |
| `ifpb-greenHover` | `#2E8B3B` | Hover do verde |
| `ifpb-greenLight` | `#EBF6EC` | Fundos suaves |
| `ifpb-breadcrumb` | `#EEF1EC` | Faixa de breadcrumb |
| `ifpb-dark` | `#424242` | Texto padrão |
| `ifpb-blue` | `#3083EE` | Apoio |
| `ifpb-red` | `#C8102E` | Erros / alertas críticos |

- Fontes base definidas em `index.css` (stack do sistema), cor de texto `#424242` e fundo `#f8faf8`.
- Uso de utilitários inline e composição de classes condicionais (template literals) para estados
  (selecionado, erro, loading, status).
- Ícones padronizados via `lucide-react`.

---

## 9. Acessibilidade

- `VLibrasButton.tsx`: botão flutuante fixo com `aria-label="Acessibilidade VLibras"` e ícone SVG
  estilizado (gancho para integração com o plugin oficial VLibras).
- `HeaderIFPB.tsx`: breadcrumb com `<nav aria-label="Breadcrumb">` e uso de elementos semânticos.
- `index.html`: `lang="en"` (ponto de melhoria — deveria ser `pt-BR`), `meta viewport` presente.
- `App.tsx`: uso de `selection:` no Tailwind e atributos `title` em botões de ação críticos.

---

## 10. Build, Scripts e Ferramentas

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite` | Servidor de desenvolvimento (HMR) em `http://localhost:5173` |
| `build` | `tsc -b && vite build` | Type-check + bundle de produção em `dist/` |
| `lint` | `oxlint` | Análise estática |
| `preview` | `vite preview` | Pré-visualização do build |

**Configurações relevantes:**

- `tsconfig.json` usa **project references** (`tsconfig.app.json` + `tsconfig.node.json`).
- `tsconfig.app.json`: `target: es2023`, `jsx: react-jsx`, `moduleResolution: bundler`,
  `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`.
- `.oxlintrc.json`: plugins `react`, `typescript`, `oxc`; regras `react/rules-of-hooks` (error) e
  `react/only-export-components` (warn).

---

## 11. Fluxo de Dados (resumo)

```
Usuário
  │
  ▼
Componente (TelaAluno / Formulario)
  │  emit event via prop (ex.: onConcluir)
  ▼
App.tsx (handler) ── setLoading(true)
  │
  ▼
EstudoDeCasoService.*  ──fetch──▶  /api/estudos-de-caso (proxy Vite → Spring Boot)
  │                                   │
  │  sucesso                          │  indisponível
  ▼                                   ▼
ResponseDTO                    localStorage (fallback) + regras locais
  │                                   │
  └──────────────┬────────────────────┘
                 ▼
        setEstudoAtual + adicionarToast
                 │
                 ▼
        Re-render (props para componentes)
```

---

## 12. Observações e Pontos de Melhoria

- **Localização do projeto**: o frontend reside em `app/frontend/` (não há pasta `frontend/` na raiz
  do repositório). Este documento foi salvo em `app/frontend/docs/`.
- **Dados mockados**: `ALUNOS_PADRAO` e `INDICADORES_PADRAO` são hardcoded e alinhados ao seed do banco
  (`collection/seed_test_data.sql`); idealmente viriam de endpoints de listagem.
- **Sem roteamento real**: a navegação por estado limita deep-linking e o botão de busca (`termoBusca`)
  não possui efeito de filtragem implementado.
- **Fallback local**: ótimo para desenvolvimento, mas pode mascarar falhas do backend em produção —
  recomenda-se desativá-lo ou exibir aviso claro em ambiente produtivo.
- **`App.css`** é resquício do template e não é importado no fluxo atual.
- **`<html lang="en">`** deveria ser `pt-BR` por se tratar de aplicação em português.
- **Testes**: não há suíte de testes configurada no frontend.
