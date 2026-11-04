import pool from "../config/database.js";

export async function listarTemasService() {
    const { rows } = await pool.query("SELECT * FROM temas ORDER BY ordem");
    return rows;
}

export async function buscarProximoTemaService(candidatoId) {
    const respostaAtual = await pool.query(
        `
        SELECT temas.id, temas.nome, temas.ordem
        FROM respostas
        JOIN questoes ON questoes.id = respostas.questao_id
        JOIN temas ON temas.id = questoes.tema_id
        WHERE respostas.candidato_id = $1
          AND respostas.letra_resposta IS NULL
          AND respostas.data_horario_resposta IS NULL
          AND statement_timestamp() - respostas.data_horario_inicio
              <= INTERVAL '150 seconds'
        ORDER BY respostas.data_horario_inicio DESC, respostas.questao_id
        LIMIT 1
        `,
        [candidatoId],
    );
    if (respostaAtual.rows.length > 0) {
        return respostaAtual.rows[0];
    }

    const resultadoPendente = await pool.query(
        `
        SELECT temas.id, temas.nome, temas.ordem
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
    if (resultadoPendente.rows.length > 0) {
        return resultadoPendente.rows[0];
    }

    return null;
}
