import pool from '../config/database.js';

export async function listarTemasService() {
    const {rows} = await pool.query('SELECT * FROM temas ORDER BY ordem');
    return rows;
}

export async function buscarProximoTemaService(candidatoId) {
    const { rows } = await pool.query(
        `SELECT t.* 
         FROM temas t
         WHERE t.id NOT IN (
             SELECT DISTINCT q.tema_id 
             FROM questoes q 
             JOIN respostas r ON r.questao_id = q.id 
             WHERE r.candidato_id = $1
         )
         ORDER BY t.ordem
         LIMIT 1`,
        [candidatoId]
    );
    return rows[0] || null;
}
