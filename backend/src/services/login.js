import pool from "../config/database.js";
import bcrypt from "bcryptjs";

export async function autenticarCandidatoService(cpf, senha) {
  const { rows } = await pool.query(`
        SELECT id, nome, email, senha_hash FROM candidatos WHERE cpf = $1
        `, [cpf]);
  if (rows.length != 1 || !rows[0].senha_hash) {
    return null;
  }
  const senhaArmazenada = rows[0].senha_hash;
  const confere = await bcrypt.compare(senha, senhaArmazenada);
  if (!confere) {
    return null;
  }
  return { id: rows[0].id, nome: rows[0].nome, email: rows[0].email };
}
