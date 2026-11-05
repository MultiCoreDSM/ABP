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
| BL-11 Correção após resposta | `alternativas.correta` | `POST /api/questoes/:id/responder` | `questao.js` | 🟡 |
| BL-12 / BL-13 Pausa, retomada, queda | `respostas` | sorteio retoma a questão em andamento | — | 🟡 |
| BL-15 Progresso | — | `buscarProximoTemaService` | — | 🟡 |
| BL-16 / BL-17 Percentual e nota | `respostas.acertou` | `emitirCertificadoService` | — | 🟡 |
| BL-18 Emissão ≥ 65% | — | `emitirCertificadoService` | — | 🟡 |
| BL-19 Modelo do certificado | — | — | `Design/certificado.png` | 🟡 |
| BL-20 / BL-21 QR Code e validação pública | `candidatos.certificado_hash` | — | — | ⬜ |
| BL-22 Histórico | `respostas` | — | — | 🟡 |
| BL-23 Responsividade | — | — | CSS das páginas | 🟡 |
