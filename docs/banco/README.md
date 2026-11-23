# Banco de dados

| Item | Valor |
|---|---|
| SGBD | **PostgreSQL 16** (versão suportada e testada) |
| Scripts | [`backend/database/`](../../backend/database) |
| Ordem de execução | `schemas.sql` → `seed.sql` |
| Modelo conceitual | [modelo-conceitual.md](modelo-conceitual.md) |
| Modelo lógico, 3FN e dicionário | [modelo-logico.md](modelo-logico.md) |

> A coluna gerada `valida` usa `STORED`. O PostgreSQL 16 não aceita colunas geradas `VIRTUAL`, que só existem a partir da versão 18.

## Opção 1: Docker (recomendado)

```bash
# crie o .env na raiz com as variáveis listadas no README principal
docker compose up -d          # cria o banco e roda schemas.sql e seed.sql automaticamente
```

> Os scripts de `docker-entrypoint-initdb.d` só rodam quando o volume está vazio. Para recriar do zero: `docker compose down -v && docker compose up -d`.

> A porta `5433` do `.env` é a do container na sua máquina. Dentro do container, o PostgreSQL continua na `5432`.

Para abrir o `psql` dentro do container:

```bash
docker compose exec database psql -U abp -d abp_multicore
```

## Opção 2: PostgreSQL 16 instalado localmente

Use no `.env` os mesmos valores do banco local. Geralmente isso significa `POSTGRES_PORT=5432` e o usuário e a senha da sua instalação. Depois, crie o banco com o nome definido em `POSTGRES_DB` e rode os scripts na raiz do repositório:

```bash
createdb -U postgres abp_multicore
psql -U postgres -d abp_multicore -v ON_ERROR_STOP=1 -f backend/database/schemas.sql
psql -U postgres -d abp_multicore -v ON_ERROR_STOP=1 -f backend/database/seed.sql
```

Os dois scripts rodam dentro de `BEGIN … COMMIT`. Se algo falhar, nada é gravado. O `-v ON_ERROR_STOP=1` faz o `psql` parar no primeiro erro, em vez de seguir e mascarar a falha.

## Como verificar a carga

```sql
SELECT (SELECT count(*) FROM temas)                         AS temas,
       (SELECT count(*) FROM questoes)                      AS questoes,
       (SELECT count(*) FROM alternativas)                  AS alternativas,
       (SELECT count(*) FROM alternativas WHERE correta)    AS corretas;
```

Resultado esperado: `12 | 48 | 192 | 48`.

## Tabelas

| Tabela | O que guarda |
|---|---|
| `candidatos` | CPF (único), nome, e-mail, hash bcrypt da senha e, depois da aprovação, código, data e nota do certificado |
| `temas` | Os 12 temas e a ordem de exibição |
| `questoes` | 4 questões por tema, com enunciado e imagem |
| `alternativas` | 4 alternativas por questão, com exatamente 1 correta |
| `respostas` | Questão sorteada para cada candidato em cada tema: início, resposta, alternativa escolhida, `acertou` e `valida` (dentro dos 150 s) |

O detalhamento das colunas está no [modelo lógico](modelo-logico.md).

As imagens das questões seguem o padrão `assets/imagens/tema_T/questao_N.png`, relativo à raiz do repositório. Para conferir se os 48 arquivos existem, rode na raiz:

```bash
psql -U postgres -d abp_multicore -tAc "SELECT imagem_url FROM questoes" \
  | while read f; do [ -f "$f" ] || echo "FALTA: $f"; done
```

Sem saída significa que todos existem.

## Migrações, índices e restrições (DB-11)

Além do `schemas.sql`, o diretório [`backend/database/migrations/`](../../backend/database/migrations/) traz migrações SQL versionadas e reversíveis (`001_estrutura_base` e `002_indices_e_restricoes`), executadas de forma idempotente pelo script [`backend/database/migrate.js`](../../backend/database/migrate.js):

```bash
cd backend
node --env-file=../.env database/migrate.js status      # lista aplicadas e pendentes
node --env-file=../.env database/migrate.js up          # cria banco vazio ou atualiza versão anterior
node --env-file=../.env database/migrate.js down        # reverte a última migração
node --env-file=../.env database/migrate.js down --all  # reverte todas (uso em ambiente de teste)
```

Índices garantidos pelas migrações:
- **CPF:** `candidatos_cpf_key` (`UNIQUE` em `candidatos.cpf`).
- **Temas:** `idx_temas_ordem` em `temas(ordem)` e `idx_questoes_tema_id` em `questoes(tema_id)`.
- **Tentativas:** `idx_tentativa_ativa_candidato` (`UNIQUE` parcial em `tentativas(candidato_id)` para estados ativos), `idx_tentativas_candidato_iniciado` e `idx_tentativa_questoes_tentativa_ordem`.
- **Histórico:** `idx_respostas_candidato_inicio` em `respostas(candidato_id, data_horario_inicio DESC)` e `idx_respostas_questao_id`.
- **Identificador público:** `idx_candidatos_certificado_hash_unico` (`UNIQUE` parcial em `candidatos(certificado_hash)` quando não nulo).

Restrições adicionais (`002_indices_e_restricoes`): ordem de tema entre 1 e 12, coerência de datas (`data_horario_resposta >= data_horario_inicio`), integridade do código e contadores do certificado e regras de consistência de resultado final.
