# Matriz de rastreabilidade

Liga cada requisito do [backlog](backlog/README.md) à issue, ao artefato e ao commit em que foi tratado. Deve ser atualizada a cada sprint, junto com o fechamento da tag de versão.

**Versão de referência:** Sprint 1 → tag `sprint-1` (`8894fda`)

## Sprint 1: artefatos de base

| Entrega | Issue | Requisitos atendidos | Artefato | Commits | PR |
|---|---|---|---|---|---|
| Protótipo das telas | #2 | BL-01 a BL-05, BL-09, BL-10, BL-15, BL-19, BL-23 | `Design/*.png`, `Design/figma parte 2.pdf` | `063bef8`, `ff7f974`, `4e71033`, `aa48cb0` | #15 |
| Casos de uso | #5 | BL-01, BL-02, BL-05, BL-09, BL-18, BL-22 | `Diagrama/UseCase Diagram1.asta` | `022ec85`, `37b74eb` | #13 |
| Banco de dados | #6 | BL-01, BL-06, BL-07, BL-08, BL-09, BL-14, BL-22 | `backend/database/schemas.sql`, `backend/database/seed.sql`, `docs/banco/` | `aae36ea`, `42f13a3`, `0ea4c83`, `d0640f7` | #14 |
| Conteúdo | #7 | BL-05, BL-06 | `assets/materiais/*.pdf`, `assets/imagens/tema_*/` | `983ac96`, `debcca8` | #8 |
| Backlog e documentação | — | todos (planejamento) | `docs/backlog/README.md`, `docs/sprints/sprint-1/`, `docs/processo/definition-of-done.md`, `docs/rastreabilidade.md` | `5eb00c1`, `0d0e5d7`, `5d776e8` | — |

## Sprint 2: qualidade

| Entrega | Código | Requisitos atendidos | Artefato | Branch | Status |
|---|---|---|---|---|---|
| Revisão de proteção de dados pessoais | QA-08 | RNF03, RNF04, BL-01, BL-02, BL-11, BL-16 a BL-19, BL-21 | [docs/qualidade/qa-08-revisao-dados-pessoais.md](qualidade/qa-08-revisao-dados-pessoais.md), [docs/qualidade/qa-08-issues.md](qualidade/qa-08-issues.md), `backend/src/middlewares/erros.js`, `backend/src/middlewares/limiteLogin.js`, `backend/src/utils/validacao.js`, `backend/src/routes/certificacao.js` | `qa-08-dados-pessoais` | ✅ (decisões do PO em DP-01 a DP-03; validação pública implementada na BL-21) |


## Requisito → onde está implementado

Status: ✅ implementado · 🟡 parcial · ⬜ não iniciado

| Requisito | Banco | Back-end | Front-end | Status |
|---|---|---|---|---|
| BL-01 Cadastro | `candidatos` | `POST /api/candidatos` | `FrontEnd/Pages/cadastro.html` | 🟡 |
| BL-02 Login | `candidatos.senha_hash` | `POST /api/login` (JWT) | `FrontEnd/Pages/login.html` | 🟡 |
| BL-03 / BL-04 Tela inicial | — | — | `FrontEnd/Pages/inicial.html` | 🟡 |
| BL-05 Área de estudos | `temas` | `GET /api/temas` | `FrontEnd/Pages/area-estudos.html` | 🟡 |
| BL-06 Banco de questões | `questoes`, `alternativas` | `GET /api/questoes/:id` | — | ✅ |
| BL-07 / BL-08 Sorteio, 1 por tema | `respostas` | `POST /api/questoes/sortear` | `FrontEnd/Pages/questao.html` | 🟡 |
| BL-09 / BL-14 150 segundos | `respostas.valida` | `sortearQuestaoService` | `FrontEnd/Scripts/questao.js` | 🟡 |
| BL-11 Correção após resposta | `alternativas.correta` | `POST /api/certificacao/questoes/:id/resposta` (a correta só sai depois da resposta registrada) | `questao.js` | 🟡 |
| BL-12 / BL-13 Pausa, retomada, queda | `respostas` | `GET /api/certificacao/temas` informa `em_andamento`; abrir outro tema com questão aberta responde 409 | `questao.js`: pausa entre questões, sair no meio encerra a questão registrando a alternativa marcada, janela "Continuar de onde parou?" | ✅ |
| BL-15 Progresso | — | `GET /api/certificacao/temas`, `GET /api/certificacao/resultado` | `questao.html` (painel de temas), `menu.html`, `resultado.html` | ✅ |
| BL-16 / BL-17 Percentual e nota | `respostas.acertou`, `respostas.valida` | `resultadoCandidatoService`, `emitirCertificadoService` | `resultado.html` | ✅ |
| BL-18 Emissão ≥ 65% | — | `emitirCertificadoService` | `resultado.html` | ✅ |
| BL-19 Modelo do certificado | `candidatos.certificado_emitido_em`, `certificado_acertos`, `certificado_total` | `GET/POST /api/candidatos/certificado` | `certificado.html` (nome, CPF, e-mail, data e hora, nota e percentual, conforme o RF18) | ✅ |
| BL-20 QR Code | `candidatos.certificado_hash` | — | Link de validação em `certificado.html`; falta o QR Code | 🟡 |
| BL-21 Validação pública | `candidatos.certificado_hash` | `GET /api/certificados/:codigo` (RN-09) | `validacao.html` | ✅ |
| BL-22 Histórico | `respostas` | `GET /api/certificacao/respostas`, `GET /api/candidatos/me` | `historico.html`, `respostas.html` | ✅ |
| BL-23 Responsividade | — | — | CSS das páginas | 🟡 |
