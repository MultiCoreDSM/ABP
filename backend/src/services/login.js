import pool from "../config/database.js";
import bcrypt from "bcryptjs";

// Hash de uma senha descartável, com o mesmo custo dos hashes reais. Quando o CPF
// não existe, o bcrypt roda contra ele: a resposta leva o mesmo tempo que a de um
// CPF cadastrado, e o tempo deixa de revelar quem está inscrito (QA-08 / R6).
const HASH_FICTICIO = bcrypt.hashSync("senha-inexistente-para-comparacao", 12);

export async function autenticarCandidatoService(cpf, senha) {
  const { rows } = await pool.query(`
        SELECT id, nome, email, senha_hash FROM candidatos WHERE cpf = $1
        `, [cpf]);
  const candidato = rows.length === 1 && rows[0].senha_hash ? rows[0] : null;

  const confere = await bcrypt.compare(senha, candidato?.senha_hash ?? HASH_FICTICIO);
  if (!candidato || !confere) {
    return null;
  }
  return { id: candidato.id, nome: candidato.nome, email: candidato.email };
}
