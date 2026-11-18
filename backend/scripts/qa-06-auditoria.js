import pg from 'pg';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const OUTPUT = resolve(ROOT, 'docs/qualidade/qa-06-relatorio.json');
const EXPECTED_THEMES = 12;
const QUESTIONS_PER_THEME = 4;
const ALTERNATIVES_PER_QUESTION = 4;
const EXPECTED_TOTAL_QUESTIONS = EXPECTED_THEMES * QUESTIONS_PER_THEME;
const LETTERS = ['A', 'B', 'C', 'D'];
const findings = [];
const counts = {};

function finding(severity, code, message, detail = {}) {
  findings.push({ severity, code, message, ...detail });
}
function anon(id) {
  return createHash('sha256').update(String(id)).digest('hex').slice(0, 12);
}
function safeImagePath(raw) {
  if (!raw || raw.includes('\\') || raw.startsWith('/') || /^[a-z]+:/i.test(raw)) return null;
  const full = resolve(ROOT, raw);
  if (!full.startsWith(ROOT + sep)) return null;
  return full;
}

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 8000,
});

try {
  if (!process.env.POSTGRES_DB || !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD) {
    throw new Error('Defina POSTGRES_DB, POSTGRES_USER e POSTGRES_PASSWORD no ambiente ou em .env.');
  }
  await client.connect();
  await client.query('BEGIN READ ONLY');

  const tableCheck = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `, [['temas', 'questoes', 'alternativas', 'candidatos', 'respostas']]);
  const tables = new Set(tableCheck.rows.map(r => r.table_name));
  const missingTables = ['temas', 'questoes', 'alternativas', 'candidatos', 'respostas'].filter(t => !tables.has(t));
  if (missingTables.length) throw new Error(`Tabelas ausentes: ${missingTables.join(', ')}. Execute schemas.sql e seed.sql.`);

  const themeRows = await client.query(`
    SELECT t.id, t.nome, t.ordem, COUNT(DISTINCT q.id)::int AS questoes
    FROM temas t LEFT JOIN questoes q ON q.tema_id = t.id
    GROUP BY t.id ORDER BY t.ordem, t.id
  `);
  counts.temas = themeRows.rowCount;
  counts.questoes = themeRows.rows.reduce((n, r) => n + r.questoes, 0);
  if (counts.temas !== EXPECTED_THEMES) finding('error', 'THEME_COUNT', `Esperados ${EXPECTED_THEMES} temas; encontrados ${counts.temas}.`);
  for (const t of themeRows.rows) {
    if (t.questoes !== QUESTIONS_PER_THEME) finding('error', 'THEME_QUESTION_COUNT', `Tema ${t.ordem} (${t.nome}): esperadas ${QUESTIONS_PER_THEME} questões; encontradas ${t.questoes}.`, { theme_id: t.id });
  }
  if (counts.questoes !== EXPECTED_TOTAL_QUESTIONS) finding('error', 'QUESTION_TOTAL', `Esperadas ${EXPECTED_TOTAL_QUESTIONS} questões; encontradas ${counts.questoes}.`);

  const questionRows = await client.query(`
    SELECT q.id, q.tema_id, q.ordem, q.enunciado, q.imagem_url,
           COUNT(a.id)::int AS alternativas,
           COUNT(a.id) FILTER (WHERE a.correta IS TRUE)::int AS corretas,
           COUNT(a.id) FILTER (WHERE BTRIM(a.texto) = '')::int AS alternativas_sem_conteudo,
           ARRAY_AGG(a.letra ORDER BY a.letra) FILTER (WHERE a.id IS NOT NULL) AS letras
    FROM questoes q LEFT JOIN alternativas a ON a.questao_id = q.id
    GROUP BY q.id ORDER BY q.tema_id, q.ordem
  `);
  counts.questoes_com_alternativas = questionRows.rows.filter(q => q.alternativas === ALTERNATIVES_PER_QUESTION).length;
  counts.questoes_com_gabarito_unico = questionRows.rows.filter(q => q.corretas === 1).length;
  counts.imagens_referenciadas = 0;
  for (const q of questionRows.rows) {
    if (q.alternativas !== ALTERNATIVES_PER_QUESTION || LETTERS.some(l => !(q.letras || []).includes(l))) {
      finding('error', 'ALTERNATIVES', `Questão ${q.id}: esperadas alternativas A-D (4); encontradas ${q.alternativas} (${(q.letras || []).join(',')}).`, { question_id: q.id });
    }
    if (!q.enunciado || !q.enunciado.trim()) finding('error', 'QUESTION_WITHOUT_CONTENT', `Questão ${q.id}: enunciado vazio.`, { question_id: q.id });
    if (q.alternativas_sem_conteudo > 0) finding('error', 'ALTERNATIVE_WITHOUT_CONTENT', `Questão ${q.id}: ${q.alternativas_sem_conteudo} alternativa(s) sem texto.`, { question_id: q.id });
    if (q.corretas !== 1) finding('error', 'ANSWER_KEY', `Questão ${q.id}: esperado exatamente 1 gabarito; encontrados ${q.corretas}.`, { question_id: q.id });
    const imagePath = safeImagePath(q.imagem_url);
    if (!imagePath) finding('error', 'IMAGE_PATH_UNSAFE', `Questão ${q.id}: caminho de imagem vazio ou fora da pasta do projeto.`, { question_id: q.id });
    else if (!existsSync(imagePath)) finding('error', 'IMAGE_MISSING', `Questão ${q.id}: imagem não encontrada (${q.imagem_url}).`, { question_id: q.id });
    else counts.imagens_referenciadas++;
  }

  const orphanChecks = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM questoes q LEFT JOIN temas t ON t.id=q.tema_id WHERE t.id IS NULL)::int AS questoes_sem_tema,
      (SELECT COUNT(*) FROM alternativas a LEFT JOIN questoes q ON q.id=a.questao_id WHERE q.id IS NULL)::int AS alternativas_orfas,
      (SELECT COUNT(*) FROM respostas r LEFT JOIN candidatos c ON c.id=r.candidato_id WHERE c.id IS NULL)::int AS respostas_sem_candidato,
      (SELECT COUNT(*) FROM respostas r LEFT JOIN questoes q ON q.id=r.questao_id WHERE q.id IS NULL)::int AS respostas_sem_questao,
      (SELECT COUNT(*) FROM respostas r LEFT JOIN alternativas a ON a.questao_id=r.questao_id AND a.letra=r.letra_resposta WHERE r.letra_resposta IS NOT NULL AND a.id IS NULL)::int AS respostas_com_letra_inexistente
  `);
  counts.orfaos = orphanChecks.rows[0];
  for (const [key, value] of Object.entries(counts.orfaos)) if (value > 0) finding('error', 'ORPHAN_RELATION', `${key}: ${value} registro(s).`);

  const responseAudit = await client.query(`
    SELECT r.candidato_id, COUNT(*)::int AS total_respostas,
           COUNT(DISTINCT q.tema_id)::int AS temas_distintos,
           COUNT(*) FILTER (WHERE r.data_horario_resposta IS NULL)::int AS abertas,
           COUNT(*) FILTER (WHERE r.data_horario_resposta IS NOT NULL AND r.acertou IS NULL)::int AS encerradas_sem_resultado,
           COUNT(*) FILTER (WHERE r.data_horario_resposta IS NOT NULL AND r.acertou IS DISTINCT FROM
             (r.letra_resposta IS NOT NULL AND EXISTS (
               SELECT 1 FROM alternativas a WHERE a.questao_id=r.questao_id AND a.letra=r.letra_resposta AND a.correta
             )))::int AS resultado_incompativel,
           COUNT(*) FILTER (WHERE r.data_horario_resposta < r.data_horario_inicio)::int AS horario_invertido,
           COUNT(DISTINCT q.tema_id)::int AS temas,
           COUNT(*) - COUNT(DISTINCT q.tema_id)::int AS selecoes_excedentes
    FROM respostas r JOIN questoes q ON q.id=r.questao_id
    GROUP BY r.candidato_id ORDER BY r.candidato_id
  `);
  counts.candidatos_com_respostas = responseAudit.rowCount;
  counts.tentativas_com_12_temas_distintos = responseAudit.rows.filter(r => r.temas_distintos === EXPECTED_THEMES && r.total_respostas === EXPECTED_THEMES).length;
  counts.tentativas_incompletas = responseAudit.rows.filter(r => r.total_respostas < EXPECTED_THEMES).length;
  for (const r of responseAudit.rows) {
    const ref = anon(r.candidato_id);
    if (r.temas_distintos > EXPECTED_THEMES || r.selecoes_excedentes > 0) finding('error', 'MULTIPLE_SELECTIONS_PER_THEME', `Histórico ${ref}: ${r.total_respostas} respostas para ${r.temas_distintos} temas; deve haver no máximo uma seleção por tema.`, { candidate_ref: ref });
    if (r.temas_distintos === EXPECTED_THEMES && r.total_respostas !== EXPECTED_THEMES) finding('error', 'ATTEMPT_SELECTION_COUNT', `Histórico ${ref}: 12 temas distintos, mas ${r.total_respostas} respostas.`, { candidate_ref: ref });
    if (r.encerradas_sem_resultado) finding('error', 'MISSING_RESULT', `Histórico ${ref}: ${r.encerradas_sem_resultado} resposta(s) encerrada(s) sem resultado.`, { candidate_ref: ref });
    if (r.resultado_incompativel) finding('error', 'ANSWER_RESULT_MISMATCH', `Histórico ${ref}: ${r.resultado_incompativel} resultado(s) incompatível(is) com a alternativa marcada.`, { candidate_ref: ref });
    if (r.horario_invertido) finding('error', 'INVALID_TIMESTAMPS', `Histórico ${ref}: ${r.horario_invertido} resposta(s) com horário anterior ao início.`, { candidate_ref: ref });
  }

  const certificateAudit = await client.query(`
    SELECT c.id,
      c.certificado_hash, c.certificado_emitido_em, c.certificado_acertos, c.certificado_total,
      COUNT(r.questao_id)::int AS total_real,
      COUNT(*) FILTER (WHERE r.acertou IS TRUE AND r.valida IS TRUE)::int AS acertos_reais,
      COUNT(DISTINCT q.tema_id)::int AS temas_realizados,
      COUNT(*) FILTER (WHERE r.data_horario_resposta IS NULL AND clock_timestamp()-r.data_horario_inicio <= INTERVAL '150 seconds')::int AS em_aberto
    FROM candidatos c
    LEFT JOIN respostas r ON r.candidato_id=c.id
    LEFT JOIN questoes q ON q.id=r.questao_id
    WHERE c.certificado_hash IS NOT NULL OR c.certificado_emitido_em IS NOT NULL
       OR c.certificado_acertos IS NOT NULL OR c.certificado_total IS NOT NULL
    GROUP BY c.id
  `);
  counts.certificados_auditados = certificateAudit.rowCount;
  for (const c of certificateAudit.rows) {
    const ref = anon(c.id);
    const expectedTotal = Number(c.total_real);
    const expectedCorrect = Number(c.acertos_reais);
    const invalid = !c.certificado_hash || !c.certificado_emitido_em || c.certificado_total !== expectedTotal || c.certificado_acertos !== expectedCorrect || expectedTotal !== EXPECTED_THEMES || Number(c.temas_realizados) !== EXPECTED_THEMES || Number(c.em_aberto) > 0 || expectedTotal === 0 || (expectedCorrect / expectedTotal) * 100 < 65;
    if (invalid) finding('error', 'CERTIFICATE_MISMATCH', `Certificado do histórico ${ref}: dados ausentes/incompatíveis, prova incompleta ou percentual inferior a 65%.`, { candidate_ref: ref });
  }

  await client.query('COMMIT');
  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warning').length;
  const report = {
    issue: 'QA-06', generated_at: new Date().toISOString(), status: errors ? 'inconsistencias_encontradas' : 'sem_inconsistencias_detectadas',
    expected: { temas: EXPECTED_THEMES, questoes_por_tema: QUESTIONS_PER_THEME, questoes_total: EXPECTED_TOTAL_QUESTIONS, alternativas_por_questao: ALTERNATIVES_PER_QUESTION, gabaritos_por_questao: 1, selecoes_por_tentativa: EXPECTED_THEMES, percentual_minimo_certificado: 65 },
    counts, summary: { errors, warnings, findings: findings.length }, findings,
    privacy: 'Nenhum nome, CPF, e-mail, senha ou hash de certificado é exportado. Históricos são identificados por referência SHA-256 truncada.'
  };
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, expected: report.expected, counts, summary: report.summary, report: OUTPUT }, null, 2));
  process.exitCode = errors ? 1 : 0;
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(`[QA-06] Falha na auditoria: ${error.message}`);
  process.exitCode = 2;
} finally {
  await client.end().catch(() => {});
}
