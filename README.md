# Entrega DB-08 corrigida — ABP MultiCore

Esta pasta contém a migração e a documentação revisadas com base na branch
`main` do repositório `MultiCoreDSM/ABP`.

## Arquivos e destinos

Copie o conteúdo mantendo os caminhos relativos a partir da raiz do repositório:

| Arquivo deste pacote | Destino no ABP |
|---|---|
| `backend/database/migrations/03-db08-controle-temporal.sql` | Mesmo caminho |
| `compose.yaml` | Substituir `compose.yaml` atual (inclui montagem da migração como etapa 03) |
| `docs/banco/README.md` | Substituir `docs/banco/README.md` atual |
| `docs/banco/controle-temporal-db-08.md` | Mesmo caminho, novo arquivo |
| `docs/banco/adendo-modelagem-db-08.md` | Mesmo caminho, novo arquivo |

**Não substitua** `schemas.sql`, `seed.sql`, `modelo-conceitual.md` ou
`modelo-logico.md` por arquivos deste pacote: eles não estão incluídos como
substituições integrais. Inclua uma referência ao adendo DB-08 nos dois modelos
conceitual e lógico, conforme a Definition of Done.

## Instalação em banco novo

1. Extraia/cop ie os arquivos para a raiz do clone.
2. Confira as variáveis do `.env` conforme `.env.example`.
3. Execute `docker compose up -d` com volume novo.
4. Consulte os logs do serviço `database` e valide as contagens descritas em
   `docs/banco/README.md`.

A inicialização automática só executa os scripts se o volume PostgreSQL estiver
vazio. **Não execute `docker compose down -v` em um banco com dados que deseja
preservar.**

## Instalação em banco existente

Faça backup primeiro. Depois execute manualmente:

```bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -f backend/database/migrations/03-db08-controle-temporal.sql
```

Não é necessário recriar `schemas.sql` ou `seed.sql` em banco existente.

## Estado de validação

- Conteúdo SQL revisado estaticamente e pacote ZIP verificado.
- Não foi possível executar a migração em PostgreSQL 16 nesta sessão.
- O backend existente ainda precisa implementar a validação de prazo, transações,
  autosave e endpoints de pausa/retomada; a migração não os implementa.
- A Definition of Done exige execução em PostgreSQL 16 com banco vazio e evidência
  de teste antes de considerar a entrega concluída.
