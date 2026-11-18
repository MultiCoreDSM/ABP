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
