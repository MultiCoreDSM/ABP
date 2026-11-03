import pool from "../config/database.js";
import bcrypt from "bcryptjs";

export async function autenticarCandidatoService(cpf, senha) {
  const { rows } = await pool.query(
    "SELECT id, cpf, nome, email, senha_hash FROM candidatos WHERE cpf = $1",
    [cpf]
  );
  if (rows.length === 0) {
    return null;
  }
  const candidato = rows[0];
  const senhaValida = await bcrypt.compare(senha, candidato.senha_hash);
  if (!senhaValida) {
    return null;
  }
  delete candidato.senha_hash;
  return candidato;
}

