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
