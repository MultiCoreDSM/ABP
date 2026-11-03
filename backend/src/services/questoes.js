import pool from '../config/database.js';

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
        `,[id]);
  return rows[0];
}

export async function sortearQuestaoService(candidatoId) {
  const { rows } = await pool.query(
    `
    SELECT q.id, q.tema_id, q.ordem, q.enunciado, q.imagem_url,
        json_agg(
            json_build_object('id', a.id, 'letra', a.letra, 'texto', a.texto)
            ORDER BY a.letra
        ) AS alternativas
    FROM questoes q
    JOIN alternativas a ON a.questao_id = q.id
    WHERE q.tema_id = (
        SELECT t.id FROM temas t
        WHERE t.id NOT IN (
            SELECT DISTINCT q2.tema_id FROM questoes q2
            JOIN respostas r ON r.questao_id = q2.id
            WHERE r.candidato_id = $1
        )
        ORDER BY t.ordem
        LIMIT 1
    )
    GROUP BY q.id
    ORDER BY random()
    LIMIT 1
    `,
    [candidatoId]
  );
  return rows[0] || null;
}
