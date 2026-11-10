# ABP DSM — Plataforma de Estudos e Certificação

Projeto desenvolvido pelo grupo **MultiCore** para criar uma plataforma de estudos e certificação em metodologias ágeis.

A ideia é oferecer materiais de apoio organizados por tema e, depois dos estudos, permitir que o candidato faça uma certificação, acompanhe seu resultado e receba um certificado que possa ser validado por QR Code.

## Sobre o projeto

A plataforma será organizada em 12 temas relacionados à agilidade, Scrum, Kanban, planejamento, métricas e qualidade. Cada tema possui um material de estudo e quatro questões disponíveis no banco de perguntas.

Durante a certificação, uma questão de cada tema será sorteada. O candidato terá um tempo limitado para responder e poderá acompanhar seu progresso até concluir a prova.

## Andamento

| Sprint | Foco | Situação |
| --- | --- | --- |
| [Sprint 1](docs/sprints/sprint-1/README.md) | Protótipo, modelagem, banco de dados e conteúdos | ⚠️ Encerrada com pendências, corrigidas após a Review (tag `sprint-1`) |
| Sprint 2 | Correções da Review, front-end, rotas da API e estudo da integração do QR Code | 🚧 Em andamento |

O andamento das atividades pode ser acompanhado pelo [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1).

## Documentação

| Documento | Descrição |
| --- | --- |
| [Backlog do produto](docs/backlog/README.md) | Requisitos funcionais, não funcionais e regras de negócio. |
| [Definition of Done](docs/processo/definition-of-done.md) | Checklist de qualidade que toda entrega precisa cumprir. |
| [Rastreabilidade](docs/rastreabilidade.md) | Requisito → issue → artefato → commit. |
| [Banco de dados](docs/banco/README.md) | Versão suportada, criação e carga do banco. |
| [Modelo conceitual (DER)](docs/banco/modelo-conceitual.md) | Entidades, atributos e cardinalidades. |
| [Modelo lógico](docs/banco/modelo-logico.md) | Relações, normalização até a 3FN e dicionário de dados. |
| [Overview da Sprint 1](docs/sprints/sprint-1/README.md) | Resumo das entregas e dos resultados da primeira sprint. |
| [Backlog da Sprint 1](docs/sprints/sprint-1/BACKLOG.md) | Atividades, responsáveis e critérios de aceite. |
| [Review e Retrospectiva da Sprint 1](docs/sprints/sprint-1/REVIEW-RETROSPECTIVA.md) | Feedback recebido e ações de melhoria. |
| [Issues](https://github.com/MultiCoreDSM/ABP/issues) | Atividades cadastradas e acompanhadas pelo time. |
| [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1) | Situação das atividades em cada etapa do fluxo. |
| [Protótipo no Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2) | Telas e fluxo de navegação da plataforma (visualização). |

## Materiais do projeto

- [Materiais de estudo](assets/materiais)
- [Protótipo no Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2)
- [Imagens das questões](assets/imagens), no padrão `tema_T/questao_N.png`

Os conteúdos estão divididos nos seguintes temas:

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

## Como executar

**Requisitos:** Node.js 20.11 ou superior · PostgreSQL 16 (ou Docker)

```bash
# 1. Variáveis de ambiente
cp .env.example .env            # ajuste senha, porta e JWT_SECRET

# 2. Banco de dados (cria as tabelas e carrega os 12 temas e 48 questões)
docker compose up -d

# 3. Back-end
cd backend
npm install
npm start                       # http://localhost:3001/api/temas
```

Sem Docker, siga o [roteiro do banco de dados](docs/banco/README.md).

O front-end fica em `FrontEnd/Pages/`. Abra `inicial.html` com um servidor estático (ex.: extensão Live Server do VS Code) a partir da **raiz do repositório**, para que os caminhos de `assets/` funcionem.

## Organização do repositório

```text
ABP/
├── assets/
│   ├── imagens/          # Imagens usadas nas questões
│   ├── materiais/        # PDFs dos 12 temas de estudo
│   └── logo.jpg          # Logo do MultiCore
├── backend/
│   ├── database/         # schemas.sql e seed.sql (PostgreSQL 16)
│   └── src/              # API Express: rotas, serviços, middlewares
├── Design/               # Protótipos e arquivos de design das telas
├── Diagrama/             # Diagrama de casos de uso
├── docs/
│   ├── backlog/          # Backlog do produto (RF, RNF e regras de negócio)
│   ├── banco/            # DER, modelo lógico, dicionário e roteiro do banco
│   ├── processo/         # Definition of Done
│   ├── rastreabilidade.md
│   └── sprints/
│       └── sprint-1/     # Overview, backlog, Review e Retrospectiva
├── FrontEnd/
│   ├── Pages/            # Páginas HTML
│   ├── Scripts/          # JavaScript de cada página
│   └── Styles/           # CSS de cada página
├── .env.example          # Modelo das variáveis de ambiente
├── compose.yaml          # Banco PostgreSQL 16 via Docker
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

---

Este README será atualizado conforme o projeto avançar e novas sprints forem concluídas.
