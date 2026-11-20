# Definition of Done (DoD)

A DoD é o padrão de qualidade que **toda** entrega precisa cumprir para ser considerada concluída e entrar no Incremento. Ela vale para todas as issues e todas as sprints. Uma issue fechada no GitHub **não** significa entrega concluída: só conta como pronta quando todos os itens abaixo foram verificados.

Critérios de aceitação são diferentes: são específicos de cada item e ficam no backlog da sprint. A DoD é comum a todos.

**Versão:** 1.0, criada em 05/11/2026 após a Review da Sprint 1. A partir da Sprint 2, cada issue só muda para "Concluída" depois de passar por esta lista.

## Para qualquer entrega

- [ ] Todos os critérios de aceitação do item foram atendidos e há **evidência** registrada na issue (print, saída de comando, link para o arquivo)
- [ ] O artefato está na branch `main`, via Pull Request revisado por pelo menos 1 integrante que não é autor
- [ ] A issue referencia o PR, e o PR referencia a issue (`Closes #N`)
- [ ] Links no README e na documentação da sprint apontam para o caminho atual (nada de "está na branch X")
- [ ] O status no backlog da sprint corresponde ao estado real (não marcar 100% se algo falhou na verificação)

## Banco de dados

- [ ] Scripts executam sem erro em **PostgreSQL 16 com banco vazio**, seguindo [docs/banco/README.md](../banco/README.md)
- [ ] A carga confere com o esperado: 12 temas, 48 questões, 192 alternativas e 1 correta por questão
- [ ] Modelo conceitual, modelo lógico e dicionário de dados atualizados se o schema mudou
- [ ] Toda referência a arquivo (ex.: `imagem_url`) aponta para um arquivo que existe no repositório

## Código (front-end e back-end)

- [ ] Roda a partir de um clone limpo seguindo apenas o README (`npm install` + `npm start`, sem passos ocultos)
- [ ] Nenhum segredo versionado (`.env` fica fora do Git; variáveis novas entram na lista do README)
- [ ] Testado manualmente o fluxo principal afetado, com o resultado registrado no PR
- [ ] Sem erros no console do navegador nem do servidor no fluxo testado
- [ ] Telas funcionam em desktop e mobile (largura de 360 px)

## Design

- [ ] Telas usam os **12 temas oficiais** e os textos do conteúdo (sem placeholder ou tema divergente)
- [ ] Link do Figma com permissão de visualização registrado no README da sprint
- [ ] Protótipo navegável cobre o fluxo, inclusive estados de erro e tempo esgotado
- [ ] Contraste e tamanho de fonte legíveis em todos os rótulos

## Conteúdo

- [ ] Material revisado por um integrante diferente do autor
- [ ] Cada imagem corresponde à questão que ilustra
- [ ] Fonte/autoria das imagens registrada
