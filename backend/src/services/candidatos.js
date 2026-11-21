import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { buscarProximoTemaService } from "./temas.js";
import { resultadoCandidatoService } from "./certificacao.js";
import { TERMOS_VERSAO, termosPendentes } from "../utils/termos.js";

export const PERCENTUAL_MINIMO = 65;

// O aceite dos termos é gravado junto com o cadastro: não existe conta sem aceite.
// A versão vem do servidor (nunca do navegador) e o horário é do banco.
export async function cadastrarCandidatoService(cpf, nome, email, senha) {
  const senhaHash = await bcrypt.hash(senha, 12);
  const { rows } = await pool.query(
    `
        INSERT INTO candidatos (cpf, nome, email, senha_hash, termos_versao, termos_aceitos_em)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (cpf) DO NOTHING
        RETURNING id, cpf, nome, email, criado_em
    `,
    [cpf, nome, email, senhaHash, TERMOS_VERSAO]
  );
  if (!rows[0]) {
    return { erro: "CPF já cadastrado." };
  }
  return rows[0];
}

// Dados do próprio candidato para o menu e o histórico (nunca o hash da senha nem o CPF)
export async function buscarCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `SELECT nome, criado_em, termos_versao FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  if (!rows[0]) return null;
  return {
    nome: rows[0].nome,
    criado_em: rows[0].criado_em,
    termos_pendentes: termosPendentes(rows[0].termos_versao),
  };
}

// null: a conta não existe mais (token emitido antes da exclusão)
export async function situacaoTermosService(candidatoId) {
  const { rows } = await pool.query(`SELECT termos_versao FROM candidatos WHERE id = $1`, [candidatoId]);
  if (!rows[0]) return null;
  return { pendentes: termosPendentes(rows[0].termos_versao) };
}

// Contas criadas antes dos termos, ou que aceitaram uma versão anterior
export async function aceitarTermosService(candidatoId) {
  const { rowCount } = await pool.query(
    `UPDATE candidatos SET termos_versao = $2, termos_aceitos_em = now() WHERE id = $1`,
    [candidatoId, TERMOS_VERSAO]
  );
  return rowCount === 1;
}

// Acesso e portabilidade (LGPD, art. 18, II e V): tudo o que o portal guarda sobre o
// candidato, em formato legível por máquina. Só o hash da senha fica de fora.
export async function exportarDadosCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `SELECT cpf, nome, email, criado_em, termos_versao, termos_aceitos_em,
            certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total
     FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  const linha = rows[0];
  if (!linha) return null;

  const respostas = await pool.query(
    `SELECT t.nome AS tema, q.ordem AS questao, r.letra_resposta, r.data_horario_inicio,
            r.data_horario_resposta, r.valida, r.acertou
     FROM respostas r
     JOIN questoes q ON q.id = r.questao_id
     JOIN temas t ON t.id = q.tema_id
     WHERE r.candidato_id = $1
     ORDER BY t.ordem`,
    [candidatoId]
  );

  return {
    gerado_em: new Date().toISOString(),
    cadastro: { cpf: linha.cpf, nome: linha.nome, email: linha.email, criado_em: linha.criado_em },
    consentimento: {
      termos_versao: linha.termos_versao,
      aceito_em: linha.termos_aceitos_em,
    },
    respostas: respostas.rows,
    certificado: formatarCertificado(linha),
  };
}

// Correção (LGPD, art. 18, III). Depois da emissão, o nome não muda: o certificado e a
// validação pública mostram o nome gravado, e trocá-lo alteraria um documento já emitido.
export async function atualizarCandidatoService(candidatoId, { nome, email }) {
  const { rows } = await pool.query(
    `SELECT nome, certificado_hash FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  if (!rows[0]) return null;
  if (nome !== undefined && nome !== rows[0].nome && rows[0].certificado_hash) {
    return { erro: "O nome não pode ser alterado depois da emissão do certificado." };
  }
  const atualizado = await pool.query(
    `UPDATE candidatos
     SET nome = COALESCE($2, nome), email = COALESCE($3, email)
     WHERE id = $1
     RETURNING nome, email`,
    [candidatoId, nome ?? null, email ?? null]
  );
  return atualizado.rows[0];
}

// Eliminação (LGPD, art. 18, VI) e revogação do consentimento (art. 8º, § 5º).
// Apaga as respostas e o cadastro numa transação: ou some tudo, ou nada.
// O certificado deixa de existir e a validação pública passa a responder "não encontrado".
export async function excluirContaService(candidatoId, senha) {
  const { rows } = await pool.query(`SELECT senha_hash FROM candidatos WHERE id = $1`, [candidatoId]);
  if (!rows[0]) return { naoEncontrado: true };
  if (!(await bcrypt.compare(senha, rows[0].senha_hash))) return { senhaIncorreta: true };

  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query(`DELETE FROM respostas WHERE candidato_id = $1`, [candidatoId]);
    await cliente.query(`DELETE FROM candidatos WHERE id = $1`, [candidatoId]);
    await cliente.query("COMMIT");
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
  return { excluida: true };
}

function formatarCertificado(linha) {
  if (!linha?.certificado_hash) return null;
  const acertos = Number(linha.certificado_acertos);
  const total = Number(linha.certificado_total);
  return {
    codigo: linha.certificado_hash,
    emitido_em: linha.certificado_emitido_em,
    acertos,
    total,
    percentual: total > 0 ? Math.round((acertos / total) * 100) : 0,
  };
}

// Certificado do próprio candidato (rota autenticada). Traz os dados do titular que o
// RF18 do documento oficial exige no certificado: nome completo, CPF e e-mail.
// A validação pública (validarCertificadoService) continua com os dados da RN-09.
export async function buscarCertificadoCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `SELECT nome, cpf, email, certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total
     FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  const certificado = formatarCertificado(rows[0]);
  if (!certificado) return null;
  return {
    ...certificado,
    titular: { nome: rows[0].nome, cpf: rows[0].cpf, email: rows[0].email },
  };
}

// Emite o certificado uma única vez; se já existe, devolve o mesmo (idempotente).
// A nota e a data ficam gravadas na emissão: a validação pública lê esses valores (RN-09).

export async function emitirCertificadoService(candidatoId) {
  // Verifica se o candidato já possui um certificado.
  // Se possuir, devolve o mesmo certificado.
  const existente = await buscarCertificadoCandidatoService(candidatoId);

  if (existente) return existente;

  // Verifica se ainda existem temas pendentes.
  const tema = await buscarProximoTemaService(candidatoId);

  if (tema != null) {
    return {
      erro: "Conclua todos os temas antes de emitir o certificado."
    };
  }

  // Obtém o resultado oficial da prova.
  const resultado = await resultadoCandidatoService(candidatoId);

  const total = Number(resultado.total);
  const acertos = Number(resultado.acertos);

  const percentual = total > 0
    ? (acertos / total) * 100
    : 0;

  // Verifica se o candidato atingiu a nota mínima.
  if (
    !resultado.concluida ||
    total === 0 ||
    percentual < PERCENTUAL_MINIMO
  ) {
    return {
      erro: `Sua nota foi ${Math.round(percentual)}%. É necessário acertar pelo menos ${PERCENTUAL_MINIMO}% das questões dentro do prazo.`
    };
  }

  // Gera um código único para validação do certificado.
  const codigo = randomBytes(32).toString("hex");

  // Salva os dados do certificado no banco.
  await pool.query(
    `
      UPDATE candidatos
      SET certificado_hash = $2,
          certificado_emitido_em = now(),
          certificado_acertos = $3,
          certificado_total = $4
      WHERE id = $1 AND certificado_hash IS NULL
    `,
    [candidatoId, codigo, acertos, total]
  );

  // Retorna o certificado salvo.
  // Também funciona caso duas solicitações ocorram simultaneamente.
  return buscarCertificadoCandidatoService(candidatoId);
}


// Mascara o CPF no formato aprovado pelo PO (RN-09): ***.456.789-**
function mascararCpf(cpf) {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

// Validação pública (BL-21, RN-09): busca só pelo código e devolve só os dados aprovados
export async function validarCertificadoService(codigo) {
  const { rows } = await pool.query(
    `SELECT nome, cpf, certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total
     FROM candidatos WHERE certificado_hash = $1`,
    [codigo]
  );
  const linha = rows[0];
  if (!linha) return null;
  const certificado = formatarCertificado(linha);
  return {
    nome: linha.nome,
    cpf: mascararCpf(linha.cpf),
    emitido_em: certificado.emitido_em,
    percentual: certificado.percentual,
    situacao: "válido",
  };
}
