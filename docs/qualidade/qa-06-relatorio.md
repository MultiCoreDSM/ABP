# QA-06 — Relatório de integridade dos dados

> Gerado automaticamente por `backend/scripts/qa-integridade.js`. Não edite à mão: rode o roteiro de novo.
> Procedimento e critérios em [qa-06-integridade-dados.md](qa-06-integridade-dados.md).

| | |
|---|---|
| **Gerado em** | 21/11/2026, 17:24:51 (horário de Brasília) |
| **Commit** | `25dc2fa` |
| **Verificações** | 24 |
| **Resultado** | ✅ Nenhuma inconsistência |
| **Dados pessoais** | Nenhum. Candidatos aparecem só pelo id interno. |

## Resumo

| ID | Grupo | Verificação | Esperado | Encontrado | Situação |
|---|---|---|---|---|---|
| C01 | Conteúdo | Quantidade de temas | 12 | 12 | ✅ OK |
| C02 | Conteúdo | Temas com ordem fora de 1 a 12 ou repetida | 0 | 0 | ✅ OK |
| C03 | Conteúdo | Quantidade de questões | 48 | 48 | ✅ OK |
| C04 | Conteúdo | Temas sem exatamente 4 questões | 0 | 0 | ✅ OK |
| C05 | Conteúdo | Questões ligadas a tema inexistente | 0 | 0 | ✅ OK |
| C06 | Conteúdo | Questões com enunciado vazio | 0 | 0 | ✅ OK |
| C07 | Conteúdo | Quantidade de alternativas | 192 | 192 | ✅ OK |
| C08 | Conteúdo | Questões sem exatamente 4 alternativas (A a D) | 0 | 0 | ✅ OK |
| C09 | Conteúdo | Questões sem exatamente 1 alternativa correta (gabarito) | 0 | 0 | ✅ OK |
| C10 | Conteúdo | Alternativas com texto vazio | 0 | 0 | ✅ OK |
| C11 | Conteúdo | Alternativas ligadas a questão inexistente | 0 | 0 | ✅ OK |
| C12 | Conteúdo | Questões com imagem ausente no disco | 0 | 0 | ✅ OK |
| C13 | Conteúdo | Temas sem material de estudo (PDF) | 0 | 0 | ✅ OK |
| T01 | Tentativas | Respostas órfãs (candidato ou questão inexistente) | 0 | 0 | ✅ OK |
| T02 | Tentativas | Respostas duplicadas: mais de uma questão do mesmo tema por candidato | 0 | 0 | ✅ OK |
| T03 | Tentativas | Tentativas sem 12 seleções distintas (mais de 12 respostas ou temas repetidos) | 0 | 0 | ✅ OK |
| T04 | Tentativas | Tentativas concluídas (12 temas encerrados) | — | 2 | ℹ️ Informativo |
| T05 | Tentativas | Respostas com horários ou campos incoerentes | 0 | 0 | ✅ OK |
| T06 | Tentativas | Correção gravada diferente do gabarito | 0 | 0 | ✅ OK |
| R01 | Certificados | Certificados emitidos | — | 2 | ℹ️ Informativo |
| R02 | Certificados | Certificados com dados de emissão incompletos | 0 | 0 | ✅ OK |
| R03 | Certificados | Códigos de certificado fora do formato (64 hexadecimais) ou repetidos | 0 | 0 | ✅ OK |
| R04 | Certificados | Certificados incompatíveis com o resultado recalculado | 0 | 0 | ✅ OK |
| R05 | Certificados | Aprovados ainda sem certificado | 0 | 0 | ✅ OK |

## Inconsistências

Nenhuma inconsistência encontrada.

## Apêndice — consultas usadas

Cada consulta pode ser executada direto no `psql`. As verificações C12 e C13 também conferem os arquivos no disco.

<details><summary>C01 — Quantidade de temas</summary>

```sql
SELECT count(*)::int AS n FROM temas
```

</details>

<details><summary>C02 — Temas com ordem fora de 1 a 12 ou repetida</summary>

```sql
SELECT t.id AS tema_id, t.ordem, t.nome
FROM temas t
WHERE t.ordem NOT BETWEEN 1 AND 12
   OR (SELECT count(*) FROM temas o WHERE o.ordem = t.ordem) > 1
ORDER BY t.ordem, t.id
```

</details>

<details><summary>C03 — Quantidade de questões</summary>

```sql
SELECT count(*)::int AS n FROM questoes
```

</details>

<details><summary>C04 — Temas sem exatamente 4 questões</summary>

```sql
SELECT t.id AS tema_id, t.nome, count(q.id)::int AS questoes
FROM temas t LEFT JOIN questoes q ON q.tema_id = t.id
GROUP BY t.id
HAVING count(q.id) <> 4
ORDER BY t.ordem
```

</details>

<details><summary>C05 — Questões ligadas a tema inexistente</summary>

```sql
SELECT q.id AS questao_id, q.tema_id
FROM questoes q LEFT JOIN temas t ON t.id = q.tema_id
WHERE t.id IS NULL ORDER BY q.id
```

</details>

<details><summary>C06 — Questões com enunciado vazio</summary>

```sql
SELECT q.id AS questao_id, q.tema_id, q.ordem
FROM questoes q WHERE btrim(q.enunciado) = '' ORDER BY q.id
```

</details>

<details><summary>C07 — Quantidade de alternativas</summary>

```sql
SELECT count(*)::int AS n FROM alternativas
```

</details>

<details><summary>C08 — Questões sem exatamente 4 alternativas (A a D)</summary>

```sql
SELECT q.id AS questao_id, q.tema_id, q.ordem, count(a.id)::int AS alternativas,
       coalesce(string_agg(a.letra, '' ORDER BY a.letra), '') AS letras
FROM questoes q LEFT JOIN alternativas a ON a.questao_id = q.id
GROUP BY q.id
HAVING count(a.id) <> 4
ORDER BY q.tema_id, q.ordem
```

</details>

<details><summary>C09 — Questões sem exatamente 1 alternativa correta (gabarito)</summary>

```sql
SELECT q.id AS questao_id, q.tema_id, q.ordem,
       count(a.id) FILTER (WHERE a.correta)::int AS corretas
FROM questoes q LEFT JOIN alternativas a ON a.questao_id = q.id
GROUP BY q.id
HAVING count(a.id) FILTER (WHERE a.correta) <> 1
ORDER BY q.tema_id, q.ordem
```

</details>

<details><summary>C10 — Alternativas com texto vazio</summary>

```sql
SELECT a.id AS alternativa_id, a.questao_id, a.letra
FROM alternativas a WHERE btrim(a.texto) = '' ORDER BY a.questao_id, a.letra
```

</details>

<details><summary>C11 — Alternativas ligadas a questão inexistente</summary>

```sql
SELECT a.id AS alternativa_id, a.questao_id
FROM alternativas a LEFT JOIN questoes q ON q.id = a.questao_id
WHERE q.id IS NULL ORDER BY a.id
```

</details>

<details><summary>C12 — Questões com imagem ausente no disco</summary>

```sql
SELECT q.id AS questao_id, q.tema_id, q.ordem, q.imagem_url FROM questoes q ORDER BY q.tema_id, q.ordem
```

</details>

<details><summary>C13 — Temas sem material de estudo (PDF)</summary>

```sql
SELECT t.id AS tema_id, t.nome FROM temas t ORDER BY t.ordem
```

</details>

<details><summary>T01 — Respostas órfãs (candidato ou questão inexistente)</summary>

```sql
SELECT r.candidato_id, r.questao_id,
       CASE WHEN c.id IS NULL AND q.id IS NULL THEN 'candidato e questão'
            WHEN c.id IS NULL THEN 'candidato' ELSE 'questão' END AS inexistente
FROM respostas r
LEFT JOIN candidatos c ON c.id = r.candidato_id
LEFT JOIN questoes q ON q.id = r.questao_id
WHERE c.id IS NULL OR q.id IS NULL
ORDER BY r.candidato_id, r.questao_id
```

</details>

<details><summary>T02 — Respostas duplicadas: mais de uma questão do mesmo tema por candidato</summary>

```sql
SELECT r.candidato_id, q.tema_id, count(*)::int AS respostas,
       string_agg(r.questao_id::text, ', ' ORDER BY r.questao_id) AS questoes
FROM respostas r JOIN questoes q ON q.id = r.questao_id
GROUP BY r.candidato_id, q.tema_id
HAVING count(*) > 1
ORDER BY r.candidato_id, q.tema_id
```

</details>

<details><summary>T03 — Tentativas sem 12 seleções distintas (mais de 12 respostas ou temas repetidos)</summary>

```sql
SELECT r.candidato_id, count(*)::int AS respostas,
       count(DISTINCT q.tema_id)::int AS temas_distintos,
       count(DISTINCT r.questao_id)::int AS questoes_distintas
FROM respostas r JOIN questoes q ON q.id = r.questao_id
GROUP BY r.candidato_id
HAVING count(*) > 12
    OR count(DISTINCT q.tema_id) <> count(*)
    OR count(DISTINCT r.questao_id) <> count(*)
ORDER BY r.candidato_id
```

</details>

<details><summary>T04 — Tentativas concluídas (12 temas encerrados)</summary>

```sql
SELECT count(*)::int AS n FROM (
  SELECT r.candidato_id
  FROM respostas r JOIN questoes q ON q.id = r.questao_id
  WHERE (r.data_horario_resposta IS NOT NULL OR now() - r.data_horario_inicio > INTERVAL '150 seconds')
  GROUP BY r.candidato_id
  HAVING count(DISTINCT q.tema_id) = 12
) concluidas
```

</details>

<details><summary>T05 — Respostas com horários ou campos incoerentes</summary>

```sql
SELECT r.candidato_id, r.questao_id, problema FROM (
  SELECT r.*, CASE
    WHEN r.letra_resposta IS NOT NULL AND r.data_horario_resposta IS NULL THEN 'letra registrada sem horário de resposta'
    WHEN r.data_horario_resposta < r.data_horario_inicio THEN 'resposta antes do início'
    WHEN r.data_horario_inicio > now() + INTERVAL '1 minute' THEN 'início no futuro'
    WHEN r.data_horario_resposta > now() + INTERVAL '1 minute' THEN 'resposta no futuro'
    WHEN r.data_horario_resposta IS NULL AND r.acertou IS NOT NULL THEN 'correção gravada em questão não encerrada'
    WHEN r.data_horario_resposta IS NOT NULL AND r.acertou IS NULL THEN 'questão encerrada sem correção'
  END AS problema
  FROM respostas r
) r
WHERE problema IS NOT NULL
ORDER BY r.candidato_id, r.questao_id
```

</details>

<details><summary>T06 — Correção gravada diferente do gabarito</summary>

```sql
SELECT r.candidato_id, r.questao_id, r.letra_resposta,
       (SELECT a.letra FROM alternativas a WHERE a.questao_id = r.questao_id AND a.correta LIMIT 1) AS letra_correta,
       r.acertou
FROM respostas r
WHERE r.data_horario_resposta IS NOT NULL
  AND r.acertou IS DISTINCT FROM coalesce(
        (SELECT a.correta FROM alternativas a
          WHERE a.questao_id = r.questao_id AND a.letra = r.letra_resposta), false)
ORDER BY r.candidato_id, r.questao_id
```

</details>

<details><summary>R01 — Certificados emitidos</summary>

```sql
SELECT count(*)::int AS n FROM candidatos WHERE certificado_hash IS NOT NULL
```

</details>

<details><summary>R02 — Certificados com dados de emissão incompletos</summary>

```sql
SELECT c.id AS candidato_id,
       (c.certificado_hash IS NOT NULL) AS tem_codigo,
       (c.certificado_emitido_em IS NOT NULL) AS tem_data,
       (c.certificado_acertos IS NOT NULL) AS tem_acertos,
       (c.certificado_total IS NOT NULL) AS tem_total
FROM candidatos c
WHERE num_nonnulls(c.certificado_hash, c.certificado_emitido_em, c.certificado_acertos, c.certificado_total) NOT IN (0, 4)
ORDER BY c.id
```

</details>

<details><summary>R03 — Códigos de certificado fora do formato (64 hexadecimais) ou repetidos</summary>

```sql
SELECT c.id AS candidato_id,
       CASE WHEN c.certificado_hash !~ '^[0-9a-f]{64}$' THEN 'formato inválido'
            ELSE 'código repetido' END AS problema
FROM candidatos c
WHERE c.certificado_hash IS NOT NULL
  AND (c.certificado_hash !~ '^[0-9a-f]{64}$'
       OR (SELECT count(*) FROM candidatos o WHERE o.certificado_hash = c.certificado_hash) > 1)
ORDER BY c.id
```

</details>

<details><summary>R04 — Certificados incompatíveis com o resultado recalculado</summary>

```sql
WITH resultado AS (
  SELECT r.candidato_id,
         count(DISTINCT q.tema_id) FILTER (WHERE (r.data_horario_resposta IS NOT NULL OR now() - r.data_horario_inicio > INTERVAL '150 seconds'))::int AS encerrados,
         count(DISTINCT q.tema_id) FILTER (WHERE (r.data_horario_resposta IS NOT NULL OR now() - r.data_horario_inicio > INTERVAL '150 seconds') AND (r.acertou IS TRUE AND r.valida IS TRUE))::int AS acertos,
         max(coalesce(r.data_horario_resposta, r.data_horario_inicio + INTERVAL '150 seconds')) AS ultima_resposta
  FROM respostas r JOIN questoes q ON q.id = r.questao_id
  GROUP BY r.candidato_id
),
total AS (SELECT count(*)::int AS n FROM temas t WHERE EXISTS (SELECT 1 FROM questoes q WHERE q.tema_id = t.id))
SELECT c.id AS candidato_id,
       c.certificado_acertos AS acertos_gravados, coalesce(res.acertos, 0) AS acertos_recalculados,
       c.certificado_total AS total_gravado, total.n AS total_temas,
       coalesce(res.encerrados, 0) AS temas_encerrados,
       concat_ws('; ',
         CASE WHEN coalesce(res.encerrados, 0) < total.n THEN 'emitido sem concluir os temas' END,
         CASE WHEN c.certificado_acertos IS DISTINCT FROM coalesce(res.acertos, 0) THEN 'acertos diferentes do recalculado' END,
         CASE WHEN c.certificado_total IS DISTINCT FROM total.n THEN 'total diferente do número de temas' END,
         CASE WHEN c.certificado_total > 0
               AND c.certificado_acertos * 100.0 / c.certificado_total < 65
              THEN 'aproveitamento gravado abaixo de 65%' END,
         CASE WHEN c.certificado_emitido_em < res.ultima_resposta THEN 'emitido antes da última resposta' END
       ) AS problema
FROM candidatos c
CROSS JOIN total
LEFT JOIN resultado res ON res.candidato_id = c.id
WHERE c.certificado_hash IS NOT NULL
  AND (coalesce(res.encerrados, 0) < total.n
       OR c.certificado_acertos IS DISTINCT FROM coalesce(res.acertos, 0)
       OR c.certificado_total IS DISTINCT FROM total.n
       OR (c.certificado_total > 0 AND c.certificado_acertos * 100.0 / c.certificado_total < 65)
       OR c.certificado_emitido_em < res.ultima_resposta)
ORDER BY c.id
```

</details>

<details><summary>R05 — Aprovados ainda sem certificado</summary>

```sql
SELECT r.candidato_id,
       count(DISTINCT q.tema_id) FILTER (WHERE (r.acertou IS TRUE AND r.valida IS TRUE))::int AS acertos
FROM respostas r
JOIN questoes q ON q.id = r.questao_id
JOIN candidatos c ON c.id = r.candidato_id
WHERE c.certificado_hash IS NULL AND (r.data_horario_resposta IS NOT NULL OR now() - r.data_horario_inicio > INTERVAL '150 seconds')
GROUP BY r.candidato_id
HAVING count(DISTINCT q.tema_id) = 12
   AND count(DISTINCT q.tema_id) FILTER (WHERE (r.acertou IS TRUE AND r.valida IS TRUE)) * 100.0 / 12 >= 65
ORDER BY r.candidato_id
```

</details>
