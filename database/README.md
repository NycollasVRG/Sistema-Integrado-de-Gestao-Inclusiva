# SIGI-CLAI — Banco de Dados

Banco de dados PostgreSQL do Sistema Integrado de Gestão Inclusiva (SIGI-CLAI), desenvolvido para apoiar a organização e o acompanhamento de informações e documentos relacionados à educação inclusiva.

## Tecnologias utilizadas

PostgreSQL — sistema gerenciador de banco de dados relacional.
pgAdmin 4 — ferramenta de administração e execução de comandos SQL.

## Estrutura do banco de dados

O banco utiliza o schema `sigi`, que organiza as tabelas e os objetos relacionados ao sistema.

As principais áreas são:

Usuários e permissões: usuários, papéis, permissões e associações entre eles.
Gestão acadêmica: cursos, disciplinas, períodos letivos, turmas e matrículas.
Cadastro de estudantes: dados dos estudantes e autodeclarações.
Documentação inclusiva: estudos de caso, Plano Educacional Individualizado (PEI), Plano Educacional por disciplina (PEA) e Relatório de Acompanhamento (RAE).
Validação documental: registro da situação de validação de laudos.
Acompanhamento educacional: atendimentos, histórico socioemocional, frequência e notas.
Alertas e notificações: estruturas para registrar alertas e notificações do sistema.
Avaliações: avaliações e adaptações de avaliação.
Auditoria: registros destinados ao rastreamento de atividades relevantes.

O script SQL também inclui chaves estrangeiras, índices, gatilhos de atualização, dados iniciais de papéis e permissões e duas views:

`vw_resumo_frequencia` — consolida informações de frequência.
`vw_status_laudo` — apresenta informações sobre o status de validação dos laudos.

## Como executar o banco de dados

### Pré-requisitos

* PostgreSQL instalado e em execução.
* pgAdmin 4 instalado.
* Arquivo `sigi_clai_postgresql.sql` disponível localmente.

### Instalação

1. Abra o pgAdmin 4 e conecte-se ao servidor PostgreSQL.
2. Crie um banco de dados chamado `sigi_clai`.
3. Clique com o botão direito no banco e abra o Query Tool.
4. Abra o arquivo `sigi_clai_postgresql.sql` ou copie seu conteúdo para o editor SQL.
5. Execute o script pressionando `F5`.
6. Atualize a árvore de navegação do pgAdmin.
7. Acesse `Schemas > sigi > Tables` para visualizar as tabelas criadas.

Recomenda-se executar o script em um banco de desenvolvimento vazio, criado especificamente para o projeto.

## Verificação da estrutura

tabelas criadas:

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'sigi'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


views:

SELECT table_name
FROM information_schema.views
WHERE table_schema = 'sigi'
ORDER BY table_name;


## Escopo e limitações

Este repositório contém a estrutura SQL inicial do banco de dados. A criação das tabelas e dos relacionamentos não significa que todos os fluxos funcionais do sistema estejam concluídos, então tratem isso apenas como um protótipo que pode ou não ser alterado.

Algumas funcionalidades dependem de implementação e integração com a aplicação, exemplo:

Integração com o SUAP.
Envio efetivo de notificações.
Funcionalidades de inteligência artificial para adaptação de avaliações.
Aplicação das regras de autorização e controle de acesso.
Validação dos fluxos de trabalho dos documentos educacionais.

As tabelas de papéis e permissões fornecem uma estrutura para autorização, mas a aplicação precisa aplicar essas regras de forma efetiva. A proteção de informações sensíveis também exige controles apropriados, que devem ser implementados e validados.

## Privacidade e segurança

Como o sistema pode lidar com informações educacionais e dados pessoais sensíveis:

Utilizem apenas dados fictícios para testes e demonstrações.
Implementem controles de acesso adequados e observem os requisitos aplicáveis da Lei Geral de Proteção de Dados (LGPD).

## Status do projeto

Banco de dados: estrutura SQL inicial criada e executada em ambiente de desenvolvimento PostgreSQL.

Próximas etapas: validação funcional, implementação das regras de acesso e integração com as funcionalidades da aplicação.
