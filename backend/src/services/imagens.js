import pool from '../config/database.js';


// http get http://localhost:3001/api/imagens/1
export async function buscarImagemPathService(id) {
    const {rows} = await pool.query('SELECT imagem_url FROM questoes WHERE id = $1', [id]);
    console.log(rows[0].imagem_url);
    return rows[0];
}
