# QA-06 — Verificação de integridade dos dados

| | |
|---|---|
| **Sprint** | Sprint 3 (06/11/2026 a 25/11/2026) |
| **Origem** | Transversal; BL-05, BL-06 e BL-22 |
| **Prioridade** | Alta |
| **Dependências** | DB-11, DB-12 e dados de teste |
| **Roteiro** | [backend/scripts/qa-integridade.js](../../backend/scripts/qa-integridade.js) |
| **Relatório** | [qa-06-relatorio.md](qa-06-relatorio.md), gerado pelo roteiro |

## Objetivo

Detectar, de forma reproduzível, temas sem conteúdo, questões sem gabarito, relações quebradas e histórico inconsistente. O roteiro roda 24 verificações e gera um relatório com a contagem esperada e a encontrada em cada uma.

## Como executar

Pré-requisitos: banco PostgreSQL no ar (`docker compose up -d database`), `.env` na raiz do repositório e dependências instaladas (`npm install` em `backend`).

```bash
cd backend
npm run qa:integridade
```

Sem o script no `package.json`, o comando equivalente é:

```bash
node --env-file=../.env scripts/qa-integridade.js
```

Opções:

- `--saida caminho.md` grava o relatório em outro arquivo. O padrão é `docs/qualidade/qa-06-relatorio.md`.

Código de saída: `0` sem inconsistências, `1` com ao menos uma inconsistência, `2` se o roteiro não conseguir rodar (por exemplo, banco fora do ar). Avisos e verificações informativas não mudam o código de saída. Por isso o roteiro também serve num pipeline de CI.

### Repetir depois de uma nova carga

1. Recrie ou recarregue o banco (`schemas.sql` e depois `seed.sql`).
2. Rode `npm run qa:integridade`.
3. Compare o novo relatório com o anterior (`git diff docs/qualidade/qa-06-relatorio.md`).

O roteiro é **somente leitura**: tudo roda numa transação `READ ONLY`, desfeita no final. Ele pode ser repetido quantas vezes for preciso, inclusive num banco com candidatos reais.

## O que é verificado

As regras vêm do [backlog](../backlog/README.md): BL-06 e RN-02 (12 temas × 4 questões × 4 alternativas, 1 correta), RN-03 (1 questão por tema), RN-04 e RN-05 (prazo de 150 s), RN-07 (aproveitamento ≥ 65%) e RN-08 (código único).

| Grupo | ID | Verificação | Esperado |
|---|---|---|---|
| Conteúdo | C01 | Quantidade de temas | 12 |
| | C02 | Temas com ordem fora de 1 a 12 ou repetida | 0 |
| | C03 | Quantidade de questões | 48 |
| | C04 | Temas sem exatamente 4 questões | 0 |
| | C05 | Questões ligadas a tema inexistente | 0 |
| | C06 | Questões com enunciado vazio | 0 |
| | C07 | Quantidade de alternativas | 192 |
| | C08 | Questões sem exatamente 4 alternativas (A a D) | 0 |
| | C09 | Questões sem exatamente 1 alternativa correta | 0 |
| | C10 | Alternativas com texto vazio | 0 |
| | C11 | Alternativas ligadas a questão inexistente | 0 |
| | C12 | Questões cuja imagem (`imagem_url`) não existe no disco | 0 |
| | C13 | Temas sem PDF de estudo (mapa em `area-estudos.js`) | 0 |
| Tentativas | T01 | Respostas órfãs (candidato ou questão inexistente) | 0 |
| | T02 | Mais de uma resposta do mesmo tema por candidato | 0 |
| | T03 | Tentativas sem 12 seleções distintas (mais de 12 respostas, tema ou questão repetidos) | 0 |
| | T04 | Tentativas concluídas (12 temas encerrados) | informativo |
| | T05 | Respostas com horários ou campos incoerentes | 0 |
| | T06 | Correção gravada (`acertou`) diferente do gabarito | 0 |
| Certificados | R01 | Certificados emitidos | informativo |
| | R02 | Certificados com dados de emissão incompletos | 0 |
| | R03 | Códigos fora do formato (64 hexadecimais) ou repetidos | 0 |
| | R04 | Certificado incompatível com o resultado recalculado das respostas | 0 |
| | R05 | Aprovados ainda sem certificado | aviso |

Detalhes das verificações que precisam de explicação:

- **C05, C11 e T01** procuram registros órfãos. As chaves estrangeiras do `schemas.sql` já impedem esses casos, mas as verificações detectam se uma carga desativar ou remover as restrições.
- **C12** resolve o `imagem_url` a partir da raiz do repositório, como faz a rota `/api/imagens/:id`, e confere se o arquivo existe, se tem extensão de imagem e se o caminho não sai do repositório.
- **T05** aponta, por resposta: letra gravada sem horário de resposta, resposta antes do início, horários no futuro, correção gravada numa questão aberta e questão encerrada sem correção.
- **T06** compara `acertou` com o gabarito. O prazo fica de fora porque é tratado pela coluna `valida`. A nota usa `acertou AND valida`, como em `services/certificacao.js`.
- **R04** recalcula o resultado a partir das respostas, com as mesmas regras do serviço, e aponta: emissão sem os 12 temas encerrados, acertos ou total diferentes do gravado, aproveitamento abaixo de 65% e emissão anterior à última resposta.
- **R05** não é erro de dados: o certificado só é emitido quando o candidato abre a página de resultado. O aviso serve para conferir a emissão.

As consultas SQL completas ficam no apêndice do relatório, prontas para rodar no `psql`.

## Dados pessoais

O relatório pode ser compartilhado (critério de aceitação 4):

- Candidatos aparecem só pelo **id interno**. As consultas nunca leem nome, CPF, e-mail ou hash de senha para o relatório.
- O **código do certificado** também não aparece: ele dá acesso à validação pública. A R03 informa só o id e o tipo do problema.
- Aparecem apenas dados de conteúdo (temas, questões e caminhos de imagem) e horários de respostas.

## Resultado da execução de 21/11/2026

Base local, commit `25dc2fa` com as alterações da branch `feature/lgpd`. O relatório completo está em [qa-06-relatorio.md](qa-06-relatorio.md).

**Primeira execução:** 22 verificações OK, 2 informativas (2 tentativas concluídas e 2 certificados emitidos) e 1 inconsistência:

- **C12: 48 questões apontavam para imagens que não existem.** O banco local guardava `assets/imagens/tema_N/questao_M.png`, mas os arquivos se chamam `tema0N_questao_M.png`. O banco foi criado antes de o bloco final do [seed.sql](../../backend/database/seed.sql) (`UPDATE questoes SET imagem_url = ...`) existir. O Docker só roda o seed na criação do volume, então o bloco nunca foi aplicado.
  **Correção:** o bloco foi aplicado no banco (48 linhas atualizadas), sem mexer em respostas, candidatos ou gabarito.

**Segunda execução, depois da correção:** 22 verificações OK, 2 informativas e nenhuma inconsistência (código de saída 0).

**Para quem tem um banco criado antes desse bloco:** rode só o bloco das imagens.

```bash
sed -n '/^-- Atualiza imagem_url/,$p' backend/database/seed.sql \
  | docker exec -i abp-database-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Também funciona recriar o banco do zero com `docker compose down -v` e depois `docker compose up -d`, mas isso **apaga todos os candidatos e respostas** do banco local.
