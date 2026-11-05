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
cp .env.example .env          # ajuste usuário, senha e porta
docker compose up -d          # cria o banco e roda schemas.sql e seed.sql automaticamente
```

> Os scripts de `docker-entrypoint-initdb.d` só rodam quando o volume está vazio. Para recriar do zero: `docker compose down -v && docker compose up -d`.

## Opção 2: PostgreSQL 16 instalado localmente

```bash
createdb -U postgres abp
psql -U postgres -d abp -v ON_ERROR_STOP=1 -f backend/database/schemas.sql
psql -U postgres -d abp -v ON_ERROR_STOP=1 -f backend/database/seed.sql
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

As imagens das questões seguem o padrão `assets/imagens/tema_T/questao_N.png`, relativo à raiz do repositório. Para conferir se os 48 arquivos existem, rode na raiz:

```bash
psql -U postgres -d abp -tAc "SELECT imagem_url FROM questoes" \
  | while read f; do [ -f "$f" ] || echo "FALTA: $f"; done
```

Sem saída significa que todos existem.
