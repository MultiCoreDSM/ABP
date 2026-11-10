# DB-08 — Controle temporal, pausa e retomada

**Compatibilidade:** schema atual do ABP, PostgreSQL 16.  
**Migração:** `backend/database/migrations/03-db08-controle-temporal.sql`  
**Dependências:** DB-05, DB-07 e DOC-04.  
**Escopo desta entrega:** dados e regras temporais, sem implementar rotas da API.

## Decisão de compatibilidade

A branch `main` consultada ainda utiliza `respostas` como registro de questão por
candidato. O backend atual (`backend/src/services/questoes.js`) também lê e grava
diretamente nessa tabela. Por isso, esta entrega **não cria uma tabela paralela
`tentativas` nem `tentativa_questoes`**: isso duplicaria o domínio antes de DB-05
estar consolidada e exigiria reescrever os serviços.

A migração acrescenta ao modelo existente:
- `respostas.data_horario_limite`: deadline persistido, calculado pelo banco a
  partir de `data_horario_inicio + 150 seconds`;
- `respostas.motivo_encerramento`: motivo imutável do fechamento;
- `eventos_certificacao`: trilha append-only para abertura, resposta, timeout,
  pausa, retomada e interrupção de conexão.

Quando DB-05/DB-07 forem consolidadas no schema físico, os eventos deverão ser
migrados para referenciar `tentativa_id` e a entidade final de resposta, por meio
de uma migração própria revisada com o backend. Não se deve renomear tabelas ou
mudar chaves desta migração sem essa revisão.

## Regras temporais

1. O servidor/banco é a fonte oficial de tempo. O relógio do navegador serve
   apenas para apresentar a contagem regressiva.
2. Ao inserir uma linha em `respostas`, o trigger fixa `data_horario_limite` em
   `data_horario_inicio + INTERVAL '150 seconds'`.
3. O início e o deadline não podem ser alterados depois da criação. Recarregar
   a página deve consultar o mesmo registro e devolver o mesmo deadline.
4. O encerramento é representado por `data_horario_resposta`; o trigger define
   esse instante com `clock_timestamp()` no servidor.
5. Uma linha encerrada não pode ter alternativa, instante ou motivo alterados.
   Uma questão encerrada nunca volta a ficar aberta.
6. `valida` continua sendo a coluna gerada que existe no schema-base. Ela não
   substitui a validação de prazo no serviço: a API precisa comparar o horário
   oficial do servidor com `data_horario_limite` dentro de uma transação.
7. O motivo deve ser um destes valores:
   - `resposta_confirmada`;
   - `tempo_esgotado`;
   - `pausa_solicitada`;
   - `interrupcao_conexao`.

## Pausa, perda de conexão e retomada

- **Pausa solicitada (BL-12):** a API encerra a questão atual com
  `motivo_encerramento = 'pausa_solicitada'`, preserva a alternativa que já
  estiver registrada e cria evento `pausa_solicitada`. A retomada cria evento
  `retomada` e seleciona a próxima questão ainda não registrada. A questão
  encerrada não é reaberta.
- **Perda de conexão/fechamento (BL-13):** não existe forma confiável de o
  servidor detectar o instante físico exato em que o navegador perdeu conexão.
  O backend deve registrar a interrupção quando detectar a ausência (por
  heartbeat ou na próxima requisição), encerrar a questão no horário de
  detecção e registrar `interrupcao_conexao`. Sem alternativa persistida,
  `acertou` deve ser `false`.
- **Tempo esgotado (BL-14):** ao alcançar o deadline, a API fecha a questão
  com `tempo_esgotado`. Para preservar a alternativa marcada no instante do
  timeout, a seleção precisa ser enviada e persistida no servidor antes do
  prazo (autosave). Uma seleção enviada somente depois do prazo não pode ser
  tratada como se tivesse sido recebida antes.
- **Retomada:** localizar o registro pendente do candidato; se o deadline
  passou, encerrar primeiro por timeout; caso contrário, devolver o deadline
  original e o tempo restante calculado pelo servidor. Não gerar novo início
  para a mesma questão.

A tabela `eventos_certificacao` armazena o histórico de transições. `ocorrido_em`
é sobrescrito pelo relógio do banco e os eventos não podem ser atualizados ou
apagados. `chave_idempotencia` permite evitar duplicação de eventos em reenvios.

## Contrato que o backend deverá seguir

As rotas/serviços futuros devem:
- autenticar o candidato e sempre filtrar por `candidato_id`;
- usar transação e `SELECT ... FOR UPDATE` ao encerrar/retomar;
- comparar `clock_timestamp()` com `data_horario_limite` no servidor;
- persistir a alternativa marcada antes do prazo, sem expor `alternativas.correta`;
- encerrar uma única vez e registrar o evento correspondente;
- em chamadas repetidas, devolver o estado já gravado, sem criar outro evento;
- nunca confiar em horário, duração ou motivo enviados como autoridade pelo navegador.

**Importante:** o serviço atual `responderQuestaoService` ainda não consulta
`data_horario_limite` nem faz bloqueio transacional. A migração protege os
campos e o histórico, mas a validação integral do fluxo depende das issues de
API (por exemplo, API-08, API-10, API-11 e API-12). Não afirmar que o limite já
está efetivamente aplicado pela API enquanto esses serviços não forem adaptados.

## Expiração e limpeza

Não apagar `respostas` nem `eventos_certificacao` automaticamente: eles compõem
o histórico de certificação (BL-22). A expiração de tentativas abandonadas deve
ser definida quando DB-05 fornecer a entidade/estado de tentativa. Até lá, a
rotina pode identificar candidatos com questões sem encerramento e prazo
ultrapassado, encerrando-as por `tempo_esgotado`; não deve remover os registros.

## Testes de aceitação para PostgreSQL 16

Executar em banco descartável criado pelo roteiro de `docs/banco/README.md`:

1. Abrir questão e confirmar que `data_horario_limite - data_horario_inicio`
   corresponde a 150 segundos.
2. Alterar `data_horario_inicio` ou `data_horario_limite`: deve falhar.
3. Encerrar questão com cada motivo permitido.
4. Tentar alterar alternativa/motivo/data de questão encerrada: deve falhar.
5. Tentar UPDATE/DELETE em `eventos_certificacao`: deve falhar.
6. Repetir evento com a mesma chave de idempotência: deve impedir duplicação.
7. Confirmar que o schema e a carga continuam retornando 12 temas, 48 questões,
   192 alternativas e 48 corretas.

## Limites desta entrega

- Não inclui rotas HTTP, cronômetro de interface, heartbeat ou autosave; isso
  pertence às entregas de API/front-end.
- Não substitui a modelagem de tentativa de DB-05 nem afirma que DB-05 esteja
  pronta.
- A migração precisa ser executada e testada em PostgreSQL 16 real antes de
  marcar a DB-08 como concluída segundo a Definition of Done.
