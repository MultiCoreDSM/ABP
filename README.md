# ABP DSM — Plataforma de Estudos e Certificação

Projeto desenvolvido pelo grupo **MultiCore** (DSM, FATEC Jacareí): uma plataforma de estudos e certificação em metodologias ágeis.

O candidato estuda os materiais de 12 temas e depois faz uma certificação com uma questão sorteada por tema. Ao final, recebe a nota e um certificado validável por QR Code.

## Sobre o projeto

São 12 temas sobre agilidade, Scrum, Kanban, planejamento, métricas e qualidade. Cada tema tem um material em PDF e quatro questões no banco.

Na certificação, o sistema sorteia uma das quatro questões de cada tema. Cada questão tem **150 segundos**, contados no servidor. A alternativa correta só aparece depois que a resposta é registrada, e o candidato precisa de **65%** de acertos para ser aprovado.

## Andamento

| Sprint | Período | Foco | Situação |
| --- | --- | --- | --- |
| [Sprint 1](docs/sprints/sprint-1/README.md) | 28/09 a 22/10/2026 | Protótipo, modelagem, banco de dados e conteúdos | ✅ Concluída (pendências da Review corrigidas, tag `sprint-1`) · [burndown](docs/burndown/burndown-sprint-1.png) |
| Sprint 2 | 23/10 a 05/11/2026 | Correções da Review, front-end, rotas da API, integração e proteção de dados (QA-08) | ✅ Concluída · [burndown](docs/burndown/burndown-sprint-2.png) |
| Sprint 3 | 06/11 a 25/11/2026 | Novo design das telas, resultado, certificado com QR Code, validação pública, histórico, LGPD e aplicação no Docker Compose | ✅ Concluída · [burndown](docs/burndown/burndown-sprint-3.png) |

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

Para gerar o `JWT_SECRET`, rode `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Sem ele, a aplicação não inicia. Se você só tem o Docker, rode o mesmo comando dentro de um container:

```bash
docker run --rm node:22-alpine node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Opcional:** `APP_URL` define o endereço que vai no QR Code do certificado em PDF (por exemplo, `APP_URL=https://certificacao.exemplo.com`). Sem ela, o sistema usa o endereço pelo qual a página foi acessada, o que basta para rodar localmente.

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
| `port is already allocated` na porta 5433 | Já existe outro banco nessa porta (por exemplo, um PostgreSQL instalado na máquina). Troque `POSTGRES_PORT` no `.env` |
| A página mostra "Erro interno" | O banco não está no ar: rode `docker compose ps` e `docker compose up -d` |

**Atualizando um banco criado antes desta versão:**
- O certificado passou a gravar a data e a nota em três colunas novas de `candidatos`, e o aceite dos termos em mais duas (`termos_versao`, `termos_aceitos_em`). Contas antigas ficam sem aceite e recebem o pedido no menu. O `schemas.sql` cria essas colunas com `ADD COLUMN IF NOT EXISTS`, então basta rodar o script de novo no banco existente.
- O `seed.sql` passou a gravar o caminho real de cada imagem já no `INSERT`. Ele atualiza as questões existentes (`ON CONFLICT ... DO UPDATE`), então também basta rodar de novo.

```bash
docker compose exec -T database psql -U abp -d abp_multicore -v ON_ERROR_STOP=1 < backend/database/schemas.sql
docker compose exec -T database psql -U abp -d abp_multicore -v ON_ERROR_STOP=1 < backend/database/seed.sql
```

Outra opção é recriar o volume com `docker compose down -v && docker compose up -d`, mas isso apaga os dados.

## Telas, API e segurança

As páginas do front-end, as rotas da API e as proteções de dados pessoais (QA-08 e LGPD) estão documentadas em [docs/aplicacao.md](docs/aplicacao.md).

**Atenção:** o repositório é público e o `seed.sql` contém o gabarito das questões. O PO aceitou esse risco por ser um projeto acadêmico ([DP-03](docs/backlog/README.md#decisões-do-po)).

## Documentação

| Documento | Descrição |
| --- | --- |
| [Telas, API e segurança](docs/aplicacao.md) | Páginas do front-end, rotas da API e proteções de dados pessoais (QA-08 e LGPD) |
| [Backlog do produto](docs/backlog/README.md) | Requisitos funcionais, não funcionais, regras de negócio e decisões do PO |
| [Rastreabilidade](docs/rastreabilidade.md) | Requisito → issue → artefato → commit, e a situação de cada requisito |
| [Definition of Done](docs/processo/definition-of-done.md) | Checklist de qualidade que toda entrega precisa cumprir |
| [Banco de dados](docs/banco/README.md) | Versão suportada, criação e carga do banco |
| [Modelo conceitual (DER)](docs/banco/modelo-conceitual.md) | Entidades, atributos e cardinalidades |
| [Modelo lógico](docs/banco/modelo-logico.md) | Relações, normalização até a 3FN e dicionário de dados |
| [Sprint 1](docs/sprints/sprint-1/README.md) | Overview, [backlog](docs/sprints/sprint-1/BACKLOG.md) e [Review e Retrospectiva](docs/sprints/sprint-1/REVIEW-RETROSPECTIVA.md) |
| [Burndown da Sprint 1](docs/burndown/burndown-sprint-1.png), [da Sprint 2](docs/burndown/burndown-sprint-2.png) e [da Sprint 3](docs/burndown/burndown-sprint-3.png) | Gráficos de burndown |
| [Issues](https://github.com/MultiCoreDSM/ABP/issues) e [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1) | Atividades cadastradas e a situação de cada uma no fluxo |
| [Protótipo no Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2) | Telas e fluxo de navegação da plataforma |

## Conteúdo

- [Materiais de estudo](assets/materiais), um PDF por tema
- [Imagens das questões](assets/imagens), no padrão `tema_T/temaTT_questao_N.png` (por exemplo, `tema_2/tema02_questao_1.png`), com `N` de 1 a 4 em cada tema

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
│       ├── utils/        # Validações (CPF, e-mail, senha) e versão dos termos
│       └── server.js     # Inicia a API e serve o front-end
├── Design/               # Protótipos das telas (PNG e PDF)
├── Diagrama/             # Diagrama de casos de uso
├── docs/
│   ├── aplicacao.md      # Telas, API e segurança
│   ├── backlog/          # Backlog do produto e decisões do PO
│   ├── banco/            # DER, modelo lógico, dicionário e roteiro do banco
│   ├── burndown/         # Gráficos de burndown das sprints
│   ├── processo/         # Definition of Done
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

<p align="center">
  <img src="assets/logo-icone.svg" alt="Logo do MultiCore" width="64"><br>
  <strong>MultiCore</strong> · DSM, FATEC Jacareí
</p>

<table align="center">
  <tr>
    <td align="center" width="160">
      <a href="https://github.com/Enzo2712">
        <img src="https://github.com/Enzo2712.png?size=200" width="96" alt="Foto de Enzo Miguel"><br>
        <strong>Enzo Miguel</strong>
      </a><br>
      <sub><a href="https://github.com/Enzo2712">@Enzo2712</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/GabrielBechtlufft">
        <img src="https://github.com/GabrielBechtlufft.png?size=200" width="96" alt="Foto de Gabriel Henrique"><br>
        <strong>Gabriel Henrique</strong>
      </a><br>
      <sub><a href="https://github.com/GabrielBechtlufft">@GabrielBechtlufft</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/GustavoMGreco">
        <img src="https://github.com/GustavoMGreco.png?size=200" width="96" alt="Foto de Gustavo Monteiro"><br>
        <strong>Gustavo Monteiro</strong>
      </a><br>
      <sub><a href="https://github.com/GustavoMGreco">@GustavoMGreco</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/Araujojvl">
        <img src="https://github.com/Araujojvl.png?size=200" width="96" alt="Foto de João Vitor"><br>
        <strong>João Vitor</strong>
      </a><br>
      <sub><a href="https://github.com/Araujojvl">@Araujojvl</a></sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="160">
      <a href="https://github.com/Juliocms46">
        <img src="https://github.com/Juliocms46.png?size=200" width="96" alt="Foto de Julio Cesar Machado"><br>
        <strong>Julio Cesar Machado</strong>
      </a><br>
      <sub><a href="https://github.com/Juliocms46">@Juliocms46</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/eduardasantosalves">
        <img src="https://github.com/eduardasantosalves.png?size=200" width="96" alt="Foto de Maria Eduarda"><br>
        <strong>Maria Eduarda</strong>
      </a><br>
      <sub><a href="https://github.com/eduardasantosalves">@eduardasantosalves</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/Rafinbolis">
        <img src="https://github.com/Rafinbolis.png?size=200" width="96" alt="Foto de Rafael de Paula"><br>
        <strong>Rafael de Paula</strong>
      </a><br>
      <sub><a href="https://github.com/Rafinbolis">@Rafinbolis</a></sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/YanRafael2711">
        <img src="https://github.com/YanRafael2711.png?size=200" width="96" alt="Foto de Yan Rafael"><br>
        <strong>Yan Rafael</strong>
      </a><br>
      <sub><a href="https://github.com/YanRafael2711">@YanRafael2711</a></sub>
    </td>
  </tr>
</table>
