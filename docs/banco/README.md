# Banco de dados

| Item | Valor |
|---|---|
| SGBD | **PostgreSQL 16** |
| Schema-base | `backend/database/schemas.sql` |
| Carga inicial | `backend/database/seed.sql` |
| Migração DB-08 | `backend/database/migrations/03-db08-controle-temporal.sql` |
| Ordem de execução | `schemas.sql` → `seed.sql` → migrações numeradas |
| Modelo conceitual | [modelo-conceitual.md](modelo-conceitual.md) |
| Modelo lógico | [modelo-logico.md](modelo-logico.md) |
| Regras temporais DB-08 | [controle-temporal-db-08.md](controle-temporal-db-08.md) |

## Docker (recomendado)

```bash
cp .env.example .env
docker compose up -d
```

O `compose.yaml` monta os scripts na ordem `01`, `02`, `03`. Os scripts de
`docker-entrypoint-initdb.d` só são executados quando o volume PostgreSQL está
vazio. Para recriar o banco local do zero (isso apaga os dados desse volume):

```bash
docker compose down -v
docker compose up -d
```

## PostgreSQL 16 instalado localmente

```bash
createdb -U postgres abp
psql -U postgres -d abp -v ON_ERROR_STOP=1 -f backend/database/schemas.sql
psql -U postgres -d abp -v ON_ERROR_STOP=1 -f backend/database/seed.sql
psql -U postgres -d abp -v ON_ERROR_STOP=1 -f backend/database/migrations/03-db08-controle-temporal.sql
```

## Verificação da carga

```sql
SELECT (SELECT count(*) FROM temas) AS temas,
       (SELECT count(*) FROM questoes) AS questoes,
       (SELECT count(*) FROM alternativas) AS alternativas,
       (SELECT count(*) FROM alternativas WHERE correta) AS corretas;
```

Resultado esperado: `12 | 48 | 192 | 48`.

> A migração DB-08 foi desenhada como alteração aditiva sobre o schema-base atual.
> Ela não substitui nem antecipa a entidade `tentativas` de DB-05, pois DB-05 ainda
> precisa ser consolidada no schema físico e integrada ao backend.
