import pool from '../config/database.js';

export async function buscarQuestaoService(id) {
    const {rows} = await pool.query('SELECT * FROM questoes WHERE id = $1', [id]);
    return rows[0];
}
