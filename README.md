# ABP DSM — Plataforma de Estudos e Certificação

Projeto desenvolvido pelo grupo **MultiCore** (DSM, FATEC Jacareí): uma plataforma de estudos e certificação em metodologias ágeis.

O candidato estuda os materiais de 12 temas e depois faz uma certificação com uma questão sorteada por tema. Ao final, recebe a nota e um certificado validável por QR Code.

## Sobre o projeto

São 12 temas sobre agilidade, Scrum, Kanban, planejamento, métricas e qualidade. Cada tema tem um material em PDF e quatro questões no banco.

Na certificação, o sistema sorteia uma das quatro questões de cada tema. Cada questão tem **150 segundos**, contados no servidor. A alternativa correta só aparece depois que a resposta é registrada, e o candidato precisa de **65%** de acertos para ser aprovado.

## O que já funciona

| Funcionalidade | Situação | Onde |
|---|---|---|
| Tela inicial com "Como funciona" | ✅ | `inicial.html` |
| Cadastro com validação no servidor (CPF, e-mail, senha) | ✅ | `cadastro.html` · `POST /api/candidatos` |
| Login com JWT e limite de tentativas | ✅ | `login.html` · `POST /api/login` |
| Menu principal com o nome do candidato e o progresso | ✅ | `menu.html` |
| Área de estudos, com o material em PDF de cada tema | ✅ | `area-estudos.html` |
| Prova: sorteio por tema, cronômetro de 150 s e correção após a resposta | ✅ | `questao.html` · `/api/certificacao` |
| Pausa entre questões e retomada de onde parou | ✅ | `questao.html` |
| Outro tema só abre depois de concluir a questão atual | ✅ | front-end e servidor (409) |
| Resultado com nota, situação (≥ 65%) e detalhamento por tema | ✅ | `resultado.html` · `GET /api/certificacao/resultado` |
| Revisão das respostas com a alternativa correta | ✅ | `respostas.html` · `GET /api/certificacao/respostas` |
| Certificado com nome, CPF, e-mail, data e hora, nota e percentual (RF18), PDF e link de validação | ✅ | `certificado.html` · `/api/candidatos/certificado` |
| Validação pública só pelo código, com os dados da RN-09 (BL-21) | ✅ | `validacao.html` · `GET /api/certificados/:codigo` |
| Histórico do candidato (BL-22) | ✅ | `historico.html` |
| QR Code no certificado (BL-20) | ⬜ | O link de validação já existe; falta gerar o QR Code |
| Explicação de cada questão | ⬜ | O banco ainda não tem o texto das explicações |
| Recuperação de senha por e-mail | ⬜ | A tela existe, mas o projeto ainda não tem serviço de e-mail |

A situação de cada requisito do backlog está na [matriz de rastreabilidade](docs/rastreabilidade.md).

## Andamento

| Sprint | Período | Foco | Situação |
| --- | --- | --- | --- |
| [Sprint 1](docs/sprints/sprint-1/README.md) | 28/09 a 22/10/2026 | Protótipo, modelagem, banco de dados e conteúdos | ⚠️ Encerrada com pendências, corrigidas após a Review (tag `sprint-1`) |
| Sprint 2 | 23/10 a 05/11/2026 | Correções da Review, front-end, rotas da API, integração e proteção de dados (QA-08) | Encerrada, com Review realizada · [burndown](docs/burndown/burndown-sprint-2.png) |
| Sprint 3 | 06/11 a 25/11/2026 | Novo design das telas, resultado, certificado, validação pública, histórico, aplicação no Docker Compose e QR Code | 🚧 Em andamento |

**Apresentação final:** 26/11/2026. As datas seguem o cronograma do documento oficial do desafio (kick off em 17/09/2026).

O andamento das atividades pode ser acompanhado pelo [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1).

## Como executar

A aplicação inteira roda em containers (RNF07 e RP05): o banco PostgreSQL 16 e a aplicação (API e front-end) sobem juntos pelo Docker Compose.

**Requisitos:** Docker Desktop. Para desenvolver sem container, também é preciso Node.js 20.11 ou superior.

**1. Variáveis de ambiente.** Crie um arquivo `.env` na **raiz** do repositório. Ele está no `.gitignore` e nunca deve ser commitado.

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5433            # porta do banco na sua máquina
POSTGRES_DB=abp_multicore
POSTGRES_USER=abp
POSTGRES_PASSWORD=troque-esta-senha
JWT_SECRET=                   # obrigatório; gere com o comando abaixo
APP_PORT=3001                 # porta da aplicação na sua máquina
```

Para gerar o `JWT_SECRET`, rode `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Sem ele, a aplicação não inicia.

**2. Subir tudo.** Com o Docker Desktop aberto, rode na raiz:

```bash
docker compose up -d --build
```

Esse comando cria o banco, roda o `schemas.sql` e o `seed.sql` (12 temas e 48 questões), monta a imagem da aplicação a partir do [`backend/Dockerfile`](backend/Dockerfile) e sobe a aplicação quando o banco estiver pronto. Depois, abra **http://localhost:3001**.

Dentro do Compose, a aplicação acessa o banco pelo nome do serviço (`database`, porta 5432). O `POSTGRES_HOST` e o `POSTGRES_PORT` do `.env` só valem para quem roda a API fora do container.

**Comandos úteis:**

| Comando | O que faz |
|---|---|
| `docker compose ps` | Mostra os containers e se o banco está saudável |
| `docker compose logs -f app` | Acompanha o log da aplicação |
| `docker compose up -d --build app` | Reconstrói a aplicação depois de mudar o código |
| `docker compose down` | Para tudo e mantém os dados |
| `docker compose down -v` | Para tudo e **apaga** os dados (candidatos e respostas) |

**Desenvolvimento sem container para a aplicação (opcional).** Para editar o código e ver o resultado sem reconstruir a imagem, suba só o banco e rode a API com Node:

```bash
docker compose up -d database
cd backend
npm install                     # só na primeira vez
npm start
```

Nesse modo, pare o container `app` antes (`docker compose stop app`), porque os dois usam a porta 3001. Sem Docker nenhum, siga o [roteiro do banco de dados](docs/banco/README.md).

O front-end é servido pela própria aplicação, na mesma origem da API. Por isso as páginas não funcionam abertas pelo Live Server ou direto do arquivo.

| Problema | Causa provável |
|---|---|
| `Defina JWT_SECRET no .env` ou `JWT_SECRET não definido` | O `.env` não está na raiz do repositório ou não tem `JWT_SECRET` |
| `failed to connect to the docker API` | O Docker Desktop não está aberto |
| `port is already allocated` ou `EADDRINUSE ... 3001` | Já existe outra aplicação na porta 3001 (por exemplo, um `npm start`) |
| A página mostra "Erro interno" | O banco não está no ar: rode `docker compose ps` e `docker compose up -d` |

## Telas

| Página | Descrição | Exige login |
|---|---|---|
| `inicial.html` | Apresentação da certificação e "Como funciona". | Não |
| `cadastro.html` | Criação de conta. Depois do cadastro, o candidato já entra e pode iniciar a prova ou ir ao menu. | Não |
| `login.html` | Acesso com CPF e senha. Leva ao menu. | Não |
| `esqueci-senha.html` | Formulário de recuperação. Por enquanto, avisa que a recuperação por e-mail ainda não está disponível. | Não |
| `menu.html` | Saudação, Exames (começar, continuar ou ver resultado), Área de Estudos, Histórico e Certificados. | Sim |
| `area-estudos.html` | Temas com o material em PDF e o botão "Responder", que abre a prova no tema. | Não (o "Responder" pede login) |
| `questao.html` | Prova com cronômetro, confirmação da resposta, correção, pausa e retomada. | Sim |
| `resultado.html` | Nota, aprovação, situação do certificado e o resultado de cada tema. | Sim |
| `respostas.html` | Resposta dada e alternativa correta de cada tema, com filtro por corretas e incorretas. | Sim |
| `certificado.html` | Certificado para baixar em PDF (pela impressão do navegador), copiar o link e validar. | Sim |
| `validacao.html` | Validação pública pelo código do certificado. | Não |
| `historico.html` | Estatísticas e linha do tempo de atividades. | Sim |

Os protótipos estão em [`Design/`](Design) e no [Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2). O visual comum das telas fica em `FrontEnd/Styles/base.css`, e as funções compartilhadas (sessão e chamadas à API) ficam em `FrontEnd/Scripts/comum.js`.

## API

Todas as rotas ficam sob `http://localhost:3001/api`. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`, e o token vem do login.

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `POST` | `/candidatos` | — | Cadastra um candidato |
| `POST` | `/login` | — | Autentica e devolve o token (expira em 1 h). Bloqueia por 15 min após 5 falhas no mesmo CPF. |
| `GET` | `/candidatos/me` | ✅ | Nome e data de cadastro do próprio candidato |
| `GET` | `/temas` | — | Lista os 12 temas |
| `GET` | `/temas/proximo` | ✅ | Próximo tema ainda não respondido |
| `GET` | `/certificacao/temas` | ✅ | Temas com `respondido` e `em_andamento` do candidato |
| `GET` | `/certificacao/temas/:id/questao` | ✅ | Sorteia ou retoma a questão do tema. Responde 409 se outra questão estiver aberta. |
| `POST` | `/certificacao/questoes/:id/resposta` | ✅ | Registra a resposta (`{ "letra": "A" }` ou `null`) e devolve a correção |
| `GET` | `/certificacao/resultado` | ✅ | Acertos, total e situação de cada tema |
| `GET` | `/certificacao/respostas` | ✅ | Respostas e correções, só dos temas já encerrados |
| `POST` | `/candidatos/certificado` | ✅ | Depois dos 12 temas, emite o certificado se o candidato tiver 65% ou mais. Se já foi emitido, devolve o mesmo. |
| `GET` | `/candidatos/certificado` | ✅ | Certificado já emitido (404 se não existe) |
| `GET` | `/certificados/:codigo` | — | Validação pública: nome, CPF mascarado, data, percentual e situação (RN-09) |
| `GET` | `/questoes/:id` | ✅ | Enunciado e alternativas, sem a correta |
| `POST` | `/questoes/sortear` · `/questoes/:id/responder` | ✅ | Versão anterior da prova, mantida por compatibilidade |
| `GET` | `/imagens/:id` | — | Imagem de uma questão |

Há exemplos de `curl` em comentários em cada arquivo de [`backend/src/routes/`](backend/src/routes).

> **Banco criado antes desta versão:** o certificado passou a gravar a data e a nota em três colunas novas de `candidatos`. O `schemas.sql` cria essas colunas com `ADD COLUMN IF NOT EXISTS`, então basta rodar o script de novo no banco existente. Outra opção é recriar o volume com `docker compose down -v && docker compose up -d`, mas isso apaga os dados.

## Segurança e dados pessoais

A revisão de proteção de dados pessoais (QA-08) está no [relatório](docs/qualidade/qa-08-revisao-dados-pessoais.md). Em resumo:
- **Senhas:** guardadas com bcrypt e nunca devolvidas pela API.
- **Dados do candidato:** cada candidato só acessa os próprios dados, porque o id vem do token.
- **Nota:** acerto e prazo são decididos no servidor, e o gabarito não vai para o navegador antes da resposta.
- **Erros:** as respostas não expõem detalhes do banco, e os logs não registram CPF, senha ou o corpo das requisições.
- **Login:** tem limite de tentativas, e o tempo de resposta não revela se um CPF está cadastrado.

**Atenção:** o repositório é público e o `seed.sql` contém o gabarito das questões. O PO aceitou esse risco por ser um projeto acadêmico ([DP-03](docs/backlog/README.md#decisões-do-po)).

## Documentação

| Documento | Descrição |
| --- | --- |
| [Backlog do produto](docs/backlog/README.md) | Requisitos funcionais, não funcionais, regras de negócio e decisões do PO |
| [Rastreabilidade](docs/rastreabilidade.md) | Requisito → issue → artefato → commit, e a situação de cada requisito |
| [Definition of Done](docs/processo/definition-of-done.md) | Checklist de qualidade que toda entrega precisa cumprir |
| [Banco de dados](docs/banco/README.md) | Versão suportada, criação e carga do banco |
| [Modelo conceitual (DER)](docs/banco/modelo-conceitual.md) | Entidades, atributos e cardinalidades |
| [Modelo lógico](docs/banco/modelo-logico.md) | Relações, normalização até a 3FN e dicionário de dados |
| [QA-08: proteção de dados pessoais](docs/qualidade/qa-08-revisao-dados-pessoais.md) | Mapa de dados pessoais, riscos, correções e testes |
| [QA-08: issues](docs/qualidade/qa-08-issues.md) | Situação de cada risco e texto da issue em aberto |
| [Sprint 1](docs/sprints/sprint-1/README.md) | Overview, [backlog](docs/sprints/sprint-1/BACKLOG.md) e [Review e Retrospectiva](docs/sprints/sprint-1/REVIEW-RETROSPECTIVA.md) |
| [Burndown da Sprint 1](docs/burndown/burndown-sprint-1.png) e [da Sprint 2](docs/burndown/burndown-sprint-2.png) | Gráficos de burndown |
| [Issues](https://github.com/MultiCoreDSM/ABP/issues) e [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1) | Atividades cadastradas e a situação de cada uma no fluxo |
| [Protótipo no Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2) | Telas e fluxo de navegação da plataforma |

## Conteúdo

- [Materiais de estudo](assets/materiais), um PDF por tema
- [Imagens das questões](assets/imagens), no padrão `tema_T/questao_N.png`

Os 12 temas são:

1. Fundamentos da Agilidade
2. Manifesto Ágil
3. Introdução ao Scrum
4. Papéis do Scrum
5. Eventos do Scrum
6. Artefatos do Scrum
7. User Stories
8. Gestão do Product Backlog
9. Kanban
10. Planejamento Ágil
11. Métricas Ágeis
12. Qualidade em Projetos Ágeis

## Organização do repositório

```text
ABP/
├── assets/
│   ├── imagens/          # Imagens usadas nas questões
│   ├── materiais/        # PDFs dos 12 temas de estudo
│   └── logo.jpg          # Logo do MultiCore
├── backend/
│   ├── database/         # schemas.sql e seed.sql (PostgreSQL 16)
│   ├── Dockerfile        # Imagem da aplicação (API + front-end)
│   └── src/
│       ├── config/       # Conexão com o banco
│       ├── middlewares/  # Autenticação, tratamento de erros, limite de login
│       ├── routes/       # Rotas da API
│       ├── services/     # Regras de negócio e consultas SQL
│       ├── utils/        # Validações (CPF, e-mail, senha)
│       └── server.js     # Inicia a API e serve o front-end
├── Design/               # Protótipos das telas (PNG e PDF)
├── Diagrama/             # Diagrama de casos de uso
├── docs/
│   ├── backlog/          # Backlog do produto e decisões do PO
│   ├── banco/            # DER, modelo lógico, dicionário e roteiro do banco
│   ├── burndown/         # Gráficos de burndown das sprints
│   ├── processo/         # Definition of Done
│   ├── qualidade/        # Revisões de qualidade (QA-08)
│   ├── rastreabilidade.md
│   └── sprints/
│       └── sprint-1/     # Overview, backlog, Review e Retrospectiva
├── FrontEnd/
│   ├── Pages/            # Páginas HTML
│   ├── Scripts/          # JavaScript de cada página
│   └── Styles/           # CSS de cada página
├── .dockerignore         # Arquivos que não entram na imagem da aplicação
├── compose.yaml          # Banco PostgreSQL 16 e aplicação via Docker Compose
└── README.md
```

## Equipe

**Grupo:** MultiCore

- Enzo Miguel
- Gabriel Henrique
- Gustavo Monteiro
- João Vitor
- Julio Cesar Machado
- Maria Eduarda
- Rafael de Paula
- Yan Rafael
