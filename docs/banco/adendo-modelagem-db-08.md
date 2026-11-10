# Adendo ao DER e modelo lógico — DB-08

Este adendo complementa os documentos principais sem apagar a modelagem original
que ainda representa o schema-base utilizado pelo backend.

## Alterações físicas de DB-08

- `respostas.data_horario_limite TIMESTAMPTZ NOT NULL`: prazo imutável,
  calculado pelo banco como `data_horario_inicio + 150 seconds`.
- `respostas.motivo_encerramento VARCHAR(32) NULL`: motivo do encerramento:
  `resposta_confirmada`, `tempo_esgotado`, `pausa_solicitada` ou
  `interrupcao_conexao`.
- `eventos_certificacao`: histórico append-only vinculado à chave composta
  `(candidato_id, questao_id)` de `respostas`. Guarda tipo, horário do servidor,
  origem, chave de idempotência e detalhes JSONB.

## Relacionamentos adicionais

- `CANDIDATO 1:N EVENTO_CERTIFICACAO`.
- `RESPOSTA 1:N EVENTO_CERTIFICACAO`, por `(candidato_id, questao_id)`.
- Os eventos não substituem `RESPOSTA`; documentam transições de estado e
  interrupções associadas à questão.

## Nota sobre DB-05

A entidade `TENTATIVA` permanece evolução planejada. Esta entrega não a cria,
pois o backend atual não a utiliza e DB-05 ainda precisa ser integrada no schema
físico. Quando isso ocorrer, a FK dos eventos deverá ser migrada para `tentativa_id`
e a entidade final de resposta definida por DB-05/DB-07.
