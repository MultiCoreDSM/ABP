import pool from '../config/database.js';

export async function listarTemasService() {
    const {rows} = await pool.query('SELECT * FROM temas ORDER BY ordem');
    return rows;
}
