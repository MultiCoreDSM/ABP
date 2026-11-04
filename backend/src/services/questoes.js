import pool from "../config/database.js";

export async function buscarQuestaoService(id) {
  const { rows } = await pool.query(
    `
        SELECT q.id, q.tema_id, q.ordem, q.enunciado, q.imagem_url,
            json_agg(
                json_build_object('id', a.id, 'letra', a.letra, 'texto', a.texto)
                ORDER BY a.letra
            ) AS alternativas
        FROM questoes q, alternativas a
        WHERE a.questao_id = q.id AND q.id = $1
        GROUP BY q.id
        `,
    [id],
  );
  return rows[0];
}

export async function sortearQuestaoService(candidatoId) {
  // 1. ultima questao sorteada
  const ultima = await pool.query(
    `
        SELECT questao_id, data_horario_inicio,
                   data_horario_inicio + INTERVAL '150 seconds' AS data_horario_limite,
                   letra_resposta IS NULL AND data_horario_resposta IS NULL
                   AND statement_timestamp() - data_horario_inicio
                       <= INTERVAL '150 seconds' AS em_andamento
            FROM respostas
            WHERE candidato_id = $1
            ORDER BY data_horario_inicio DESC, questao_id
            LIMIT 1`,
    [candidatoId],
  );

  let tentativa = ultima.rows[0];
  if (!tentativa || !tentativa.em_andamento) {

    // 2. tema e ordem
    const tema = await pool.query(
      `
        SELECT temas.id, temas.ordem
                FROM temas
                WHERE EXISTS (
                    SELECT 1 FROM questoes WHERE questoes.tema_id = temas.id
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM respostas
                    JOIN questoes ON questoes.id = respostas.questao_id
                    WHERE respostas.candidato_id = $1
                      AND questoes.tema_id = temas.id
                )
                ORDER BY temas.ordem, temas.id
                LIMIT 1
        `,
      [candidatoId],
    );
    if (tema.rows.length == 0) {
      return null;
    }

    // 3. pega o id da questao sorteada
    const sorteio = await pool.query(
      `
        SELECT questoes.id
                FROM questoes
                LEFT JOIN respostas ON respostas.questao_id = questoes.id
                                   AND respostas.candidato_id = $1
                WHERE questoes.tema_id = $2 AND respostas.questao_id IS NULL
                ORDER BY random()
                LIMIT 1
        `,
      [candidatoId, tema.rows[0].id],
    );
    // 4. insere na tabela respostas
    const registro = await pool.query(
      `
        INSERT INTO respostas (candidato_id, questao_id, data_horario_inicio)
        VALUES ($1, $2, clock_timestamp())
        RETURNING questao_id, data_horario_inicio,
                    data_horario_inicio + INTERVAL '150 seconds' AS data_horario_limite

        `,
      [candidatoId, sorteio.rows[0].id],
    );
    tentativa = registro.rows[0];
  }

  const questao = await buscarQuestaoService(tentativa.questao_id);
  return {
    questao,
    data_horario_inicio: tentativa.data_horario_inicio,
    data_horario_limite: tentativa.data_horario_limite,
  };
}
