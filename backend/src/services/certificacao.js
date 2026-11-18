import pool from "../config/database.js";
import { buscarQuestaoService } from "./questoes.js";

// Rotas usadas pela página da prova (FrontEnd/Pages/questao.html).
// Regras: 1 questão sorteada por tema (RN-03), 150 s por questão contados no
// servidor (RN-04, RNF-05), resposta fora do prazo ou sem alternativa conta como
// incorreta (RN-05) e a alternativa correta só é enviada depois que a resposta
// foi registrada (BL-11). O gabarito nunca vai para o navegador antes disso.

const PRAZO = "INTERVAL '150 seconds'";

export async function listarTemasCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `
    SELECT t.id, t.nome, t.ordem,
           EXISTS (
             SELECT 1
             FROM respostas r
             JOIN questoes q ON q.id = r.questao_id
             WHERE r.candidato_id = $1
               AND q.tema_id = t.id
               AND (r.data_horario_resposta IS NOT NULL
                    OR clock_timestamp() - r.data_horario_inicio > ${PRAZO})
           ) AS respondido,
           -- Questão aberta e ainda dentro do prazo: é dela que o candidato continua
           EXISTS (
             SELECT 1
             FROM respostas r
             JOIN questoes q ON q.id = r.questao_id
             WHERE r.candidato_id = $1
               AND q.tema_id = t.id
               AND r.data_horario_resposta IS NULL
               AND clock_timestamp() - r.data_horario_inicio <= ${PRAZO}
           ) AS em_andamento
    FROM temas t
    WHERE EXISTS (SELECT 1 FROM questoes WHERE questoes.tema_id = t.id)
    ORDER BY t.ordem, t.id
    `,
    [candidatoId],
  );
  return rows;
}

// Situação da tentativa do candidato em uma questão, com a correção se já encerrada
async function situacaoResposta(candidatoId, questaoId) {
  const { rows } = await pool.query(
    `
    SELECT r.letra_resposta, r.data_horario_resposta, r.valida, r.acertou,
           GREATEST(0, CEIL(EXTRACT(EPOCH FROM
             r.data_horario_inicio + ${PRAZO} - clock_timestamp())))::int AS segundos_restantes,
           (SELECT a.letra FROM alternativas a
             WHERE a.questao_id = r.questao_id AND a.correta) AS letra_correta
    FROM respostas r
    WHERE r.candidato_id = $1 AND r.questao_id = $2
    `,
    [candidatoId, questaoId],
  );
  const linha = rows[0];
  if (!linha) return null;

  const encerrada = linha.data_horario_resposta != null;
  return {
    segundos_restantes: encerrada ? 0 : linha.segundos_restantes,
    correcao: encerrada
      ? {
          letra_resposta: linha.letra_resposta ? linha.letra_resposta.trim() : null,
          letra_correta: linha.letra_correta.trim(),
          // Só conta como acerto se a resposta chegou dentro do prazo
          acertou: linha.acertou === true && linha.valida === true,
          tempo_esgotado: linha.valida !== true,
        }
      : null,
  };
}

// Abre (ou retoma) a questão do tema: sorteia na primeira vez e devolve a mesma depois
export async function abrirQuestaoTemaService(candidatoId, temaId) {
  const cliente = await pool.connect();
  let questaoId;
  try {
    await cliente.query("BEGIN");
    // Serializa as aberturas do mesmo candidato: evita sortear 2 questões no mesmo tema
    await cliente.query("SELECT pg_advisory_xact_lock($1)", [candidatoId]);

    const existente = await cliente.query(
      `
      SELECT r.questao_id
      FROM respostas r
      JOIN questoes q ON q.id = r.questao_id
      WHERE r.candidato_id = $1 AND q.tema_id = $2
      LIMIT 1
      `,
      [candidatoId, temaId],
    );

    if (existente.rows.length > 0) {
      questaoId = existente.rows[0].questao_id;
    } else {
      // Só abre um tema novo depois de concluir a questão atual: com uma questão
      // aberta e dentro do prazo em outro tema, devolve esse tema em vez de sortear
      const aberta = await cliente.query(
        `
        SELECT q.tema_id
        FROM respostas r
        JOIN questoes q ON q.id = r.questao_id
        WHERE r.candidato_id = $1
          AND r.data_horario_resposta IS NULL
          AND clock_timestamp() - r.data_horario_inicio <= ${PRAZO}
        LIMIT 1
        `,
        [candidatoId],
      );
      if (aberta.rows.length > 0) {
        await cliente.query("ROLLBACK");
        return { bloqueado: { tema_id: aberta.rows[0].tema_id } };
      }

      const sorteio = await cliente.query(
        `
        INSERT INTO respostas (candidato_id, questao_id, data_horario_inicio)
        SELECT $1, q.id, clock_timestamp()
        FROM questoes q
        WHERE q.tema_id = $2
        ORDER BY random()
        LIMIT 1
        RETURNING questao_id
        `,
        [candidatoId, temaId],
      );
      if (sorteio.rows.length === 0) {
        await cliente.query("ROLLBACK");
        return null; // tema inexistente ou sem questões
      }
      questaoId = sorteio.rows[0].questao_id;
    }

    // Prazo vencido sem resposta (ex.: navegador fechado): encerra como incorreta (BL-13, RN-05)
    await cliente.query(
      `
      UPDATE respostas
      SET data_horario_resposta = clock_timestamp(), acertou = false
      WHERE candidato_id = $1 AND questao_id = $2
        AND data_horario_resposta IS NULL
        AND clock_timestamp() - data_horario_inicio > ${PRAZO}
      `,
      [candidatoId, questaoId],
    );

    await cliente.query("COMMIT");
  } catch (err) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }

  const questao = await buscarQuestaoService(questaoId);
  const situacao = await situacaoResposta(candidatoId, questaoId);
  return {
    id: questao.id,
    enunciado: questao.enunciado,
    imagem_url: questao.imagem_url,
    alternativas: questao.alternativas.map(({ letra, texto }) => ({ letra: letra.trim(), texto })),
    ...situacao,
  };
}

// Registra a resposta (letra ou null quando o tempo acabou sem alternativa marcada).
// Idempotente: se a questão já foi encerrada, devolve a correção registrada.
export async function responderQuestaoCandidatoService(candidatoId, questaoId, letra) {
  await pool.query(
    `
    UPDATE respostas
    SET letra_resposta = $3,
        data_horario_resposta = clock_timestamp(),
        acertou = COALESCE(
          (SELECT a.correta FROM alternativas a WHERE a.questao_id = $2 AND a.letra = $3),
          false)
    WHERE candidato_id = $1 AND questao_id = $2 AND data_horario_resposta IS NULL
    `,
    [candidatoId, questaoId, letra],
  );

  const situacao = await situacaoResposta(candidatoId, questaoId);
  return situacao ? situacao.correcao : null;
}

// Questão encerrada: respondida, ou com o prazo vencido sem resposta (conta como incorreta)
const ENCERRADA = `(r.data_horario_resposta IS NOT NULL OR clock_timestamp() - r.data_horario_inicio > ${PRAZO})`;
// Acerto só vale dentro do prazo (RN-05)
const ACERTOU = `(r.acertou IS TRUE AND r.valida IS TRUE)`;

// Resultado da certificação: situação de cada tema e o total de acertos (BL-15, BL-16, BL-17)
export async function resultadoCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `
    SELECT t.id, t.nome, t.ordem,
           COALESCE(${ENCERRADA}, false) AS respondido,
           COALESCE(${ENCERRADA} AND ${ACERTOU}, false) AS acertou
    FROM temas t
    LEFT JOIN questoes q ON q.tema_id = t.id
    LEFT JOIN respostas r ON r.questao_id = q.id AND r.candidato_id = $1
    WHERE EXISTS (SELECT 1 FROM questoes WHERE questoes.tema_id = t.id)
    `,
    [candidatoId],
  );

  // Um tema tem 4 questões, mas o candidato responde no máximo uma: agrupa por tema
  const porTema = new Map();
  for (const linha of rows) {
    const atual = porTema.get(linha.id) ?? { id: linha.id, nome: linha.nome, ordem: linha.ordem, respondido: false, acertou: false };
    atual.respondido ||= linha.respondido;
    atual.acertou ||= linha.acertou;
    porTema.set(linha.id, atual);
  }
  const temas = [...porTema.values()].sort((a, b) => a.ordem - b.ordem);
  const respondidos = temas.filter((t) => t.respondido).length;
  const acertos = temas.filter((t) => t.acertou).length;

  return {
    total: temas.length,
    respondidos,
    acertos,
    concluida: respondidos === temas.length && temas.length > 0,
    temas,
  };
}

// Respostas e correções dos temas já encerrados (BL-11, BL-22).
// Temas em andamento ou não iniciados ficam de fora: o gabarito deles não sai do servidor.
export async function respostasCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `
    SELECT t.id AS tema_id, t.nome AS tema_nome, t.ordem AS tema_ordem,
           q.id AS questao_id, q.enunciado,
           r.letra_resposta, r.data_horario_inicio, r.data_horario_resposta,
           ${ACERTOU} AS acertou,
           (r.valida IS NOT TRUE) AS tempo_esgotado,
           (SELECT json_agg(json_build_object('letra', a.letra, 'texto', a.texto, 'correta', a.correta)
                            ORDER BY a.letra)
              FROM alternativas a WHERE a.questao_id = q.id) AS alternativas
    FROM respostas r
    JOIN questoes q ON q.id = r.questao_id
    JOIN temas t ON t.id = q.tema_id
    WHERE r.candidato_id = $1 AND ${ENCERRADA}
    ORDER BY t.ordem
    `,
    [candidatoId],
  );

  return rows.map((linha) => {
    const alternativas = linha.alternativas.map((a) => ({ letra: a.letra.trim(), texto: a.texto, correta: a.correta }));
    return {
      tema: { id: linha.tema_id, nome: linha.tema_nome, ordem: linha.tema_ordem },
      questao_id: linha.questao_id,
      enunciado: linha.enunciado,
      letra_resposta: linha.letra_resposta ? linha.letra_resposta.trim() : null,
      letra_correta: alternativas.find((a) => a.correta).letra,
      acertou: linha.acertou,
      tempo_esgotado: linha.tempo_esgotado,
      alternativas: alternativas.map(({ letra, texto }) => ({ letra, texto })),
      // Sem resposta registrada (prazo vencido), a data é o fim do prazo
      respondida_em: linha.data_horario_resposta ?? new Date(new Date(linha.data_horario_inicio).getTime() + 150000),
    };
  });
}
