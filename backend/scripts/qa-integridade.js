// QA-06 — Verificação de integridade dos dados (BL-05, BL-06, BL-22).
//
// Roteiro reproduzível: confere conteúdo (temas, questões, alternativas, imagens e
// materiais), tentativas e respostas, e resultados x certificados. Gera um relatório
// em Markdown com contagens esperadas e encontradas e a identificação de cada
// inconsistência.
//
// Uso (na pasta backend):
//   npm run qa:integridade
//   node --env-file=../.env scripts/qa-integridade.js [--saida caminho.md]
//
// Garantias:
// - Somente leitura: tudo roda numa transação READ ONLY desfeita no final.
// - Sem dados pessoais: candidatos aparecem só pelo id interno. Nome, CPF, e-mail,
//   hash de senha e código do certificado nunca são lidos para o relatório.
// - Código de saída 1 quando existe ao menos uma inconsistência do tipo "erro".
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import pool from "../src/config/database.js";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const SAIDA_PADRAO = path.join(RAIZ, "docs/qualidade/qa-06-relatorio.md");
const LIMITE_LINHAS = 50; // ocorrências listadas por verificação no relatório

// Regras do backlog usadas nas verificações
const TEMAS = 12;            // BL-06
const QUESTOES_POR_TEMA = 4; // BL-06, RN-02
const ALTERNATIVAS = 4;      // RN-02
const PERCENTUAL_MINIMO = 65; // RN-07
const PRAZO = "INTERVAL '150 seconds'"; // RN-04

// Mesmas definições usadas em services/certificacao.js
const ENCERRADA = `(r.data_horario_resposta IS NOT NULL OR now() - r.data_horario_inicio > ${PRAZO})`;
const ACERTOU = `(r.acertou IS TRUE AND r.valida IS TRUE)`;

// Cada verificação: tipo "contagem" (compara um número) ou "ocorrencias"
// (a consulta lista os registros inconsistentes; o esperado é zero).
// Severidade "aviso" aparece no relatório mas não reprova o roteiro.
const VERIFICACOES = [
  // ===== 1. Conteúdo (BL-05, BL-06, RN-02) =====
  {
    id: "C01", grupo: "Conteúdo", titulo: "Quantidade de temas", tipo: "contagem", esperado: TEMAS,
    sql: `SELECT count(*)::int AS n FROM temas`,
  },
  {
    id: "C02", grupo: "Conteúdo", titulo: "Temas com ordem fora de 1 a 12 ou repetida",
    sql: `
      SELECT t.id AS tema_id, t.ordem, t.nome
      FROM temas t
      WHERE t.ordem NOT BETWEEN 1 AND ${TEMAS}
         OR (SELECT count(*) FROM temas o WHERE o.ordem = t.ordem) > 1
      ORDER BY t.ordem, t.id`,
  },
  {
    id: "C03", grupo: "Conteúdo", titulo: "Quantidade de questões", tipo: "contagem", esperado: TEMAS * QUESTOES_POR_TEMA,
    sql: `SELECT count(*)::int AS n FROM questoes`,
  },
  {
    id: "C04", grupo: "Conteúdo", titulo: `Temas sem exatamente ${QUESTOES_POR_TEMA} questões`,
    sql: `
      SELECT t.id AS tema_id, t.nome, count(q.id)::int AS questoes
      FROM temas t LEFT JOIN questoes q ON q.tema_id = t.id
      GROUP BY t.id
      HAVING count(q.id) <> ${QUESTOES_POR_TEMA}
      ORDER BY t.ordem`,
  },
  {
    id: "C05", grupo: "Conteúdo", titulo: "Questões ligadas a tema inexistente",
    sql: `
      SELECT q.id AS questao_id, q.tema_id
      FROM questoes q LEFT JOIN temas t ON t.id = q.tema_id
      WHERE t.id IS NULL ORDER BY q.id`,
  },
  {
    id: "C06", grupo: "Conteúdo", titulo: "Questões com enunciado vazio",
    sql: `
      SELECT q.id AS questao_id, q.tema_id, q.ordem
      FROM questoes q WHERE btrim(q.enunciado) = '' ORDER BY q.id`,
  },
  {
    id: "C07", grupo: "Conteúdo", titulo: "Quantidade de alternativas", tipo: "contagem",
    esperado: TEMAS * QUESTOES_POR_TEMA * ALTERNATIVAS,
    sql: `SELECT count(*)::int AS n FROM alternativas`,
  },
  {
    id: "C08", grupo: "Conteúdo", titulo: `Questões sem exatamente ${ALTERNATIVAS} alternativas (A a D)`,
    sql: `
      SELECT q.id AS questao_id, q.tema_id, q.ordem, count(a.id)::int AS alternativas,
             coalesce(string_agg(a.letra, '' ORDER BY a.letra), '') AS letras
      FROM questoes q LEFT JOIN alternativas a ON a.questao_id = q.id
      GROUP BY q.id
      HAVING count(a.id) <> ${ALTERNATIVAS}
      ORDER BY q.tema_id, q.ordem`,
  },
  {
    id: "C09", grupo: "Conteúdo", titulo: "Questões sem exatamente 1 alternativa correta (gabarito)",
    sql: `
      SELECT q.id AS questao_id, q.tema_id, q.ordem,
             count(a.id) FILTER (WHERE a.correta)::int AS corretas
      FROM questoes q LEFT JOIN alternativas a ON a.questao_id = q.id
      GROUP BY q.id
      HAVING count(a.id) FILTER (WHERE a.correta) <> 1
      ORDER BY q.tema_id, q.ordem`,
  },
  {
    id: "C10", grupo: "Conteúdo", titulo: "Alternativas com texto vazio",
    sql: `
      SELECT a.id AS alternativa_id, a.questao_id, a.letra
      FROM alternativas a WHERE btrim(a.texto) = '' ORDER BY a.questao_id, a.letra`,
  },
  {
    id: "C11", grupo: "Conteúdo", titulo: "Alternativas ligadas a questão inexistente",
    sql: `
      SELECT a.id AS alternativa_id, a.questao_id
      FROM alternativas a LEFT JOIN questoes q ON q.id = a.questao_id
      WHERE q.id IS NULL ORDER BY a.id`,
  },
  {
    id: "C12", grupo: "Conteúdo", titulo: "Questões com imagem ausente no disco",
    descricao: "imagem_url é resolvido a partir da raiz do repositório, como faz a rota /api/imagens/:id.",
    sql: `SELECT q.id AS questao_id, q.tema_id, q.ordem, q.imagem_url FROM questoes q ORDER BY q.tema_id, q.ordem`,
    // Filtra em JS: só ficam as linhas cujo arquivo não existe
    filtrar: (linhas) => linhas
      .map((l) => ({ ...l, problema: problemaArquivo(l.imagem_url, [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]) }))
      .filter((l) => l.problema),
  },
  {
    id: "C13", grupo: "Conteúdo", titulo: "Temas sem material de estudo (PDF)",
    descricao: "O PDF de cada tema é associado pelo id do tema em FrontEnd/Scripts/area-estudos.js.",
    sql: `SELECT t.id AS tema_id, t.nome FROM temas t ORDER BY t.ordem`,
    filtrar: (linhas) => {
      const materiais = lerMateriais();
      return linhas
        .map((l) => {
          const arquivo = materiais[l.tema_id];
          const problema = arquivo
            ? problemaArquivo(`assets/materiais/${arquivo}`, [".pdf"])
            : "tema sem PDF associado em area-estudos.js";
          return { ...l, material: arquivo ?? "—", problema };
        })
        .filter((l) => l.problema);
    },
  },

  // ===== 2. Tentativas e respostas (BL-07, BL-08, BL-22, RN-03) =====
  {
    id: "T01", grupo: "Tentativas", titulo: "Respostas órfãs (candidato ou questão inexistente)",
    sql: `
      SELECT r.candidato_id, r.questao_id,
             CASE WHEN c.id IS NULL AND q.id IS NULL THEN 'candidato e questão'
                  WHEN c.id IS NULL THEN 'candidato' ELSE 'questão' END AS inexistente
      FROM respostas r
      LEFT JOIN candidatos c ON c.id = r.candidato_id
      LEFT JOIN questoes q ON q.id = r.questao_id
      WHERE c.id IS NULL OR q.id IS NULL
      ORDER BY r.candidato_id, r.questao_id`,
  },
  {
    id: "T02", grupo: "Tentativas", titulo: "Respostas duplicadas: mais de uma questão do mesmo tema por candidato",
    sql: `
      SELECT r.candidato_id, q.tema_id, count(*)::int AS respostas,
             string_agg(r.questao_id::text, ', ' ORDER BY r.questao_id) AS questoes
      FROM respostas r JOIN questoes q ON q.id = r.questao_id
      GROUP BY r.candidato_id, q.tema_id
      HAVING count(*) > 1
      ORDER BY r.candidato_id, q.tema_id`,
  },
  {
    id: "T03", grupo: "Tentativas", titulo: "Tentativas sem 12 seleções distintas (mais de 12 respostas ou temas repetidos)",
    descricao: "Toda tentativa tem no máximo 12 respostas, cada uma de um tema e de uma questão diferentes.",
    sql: `
      SELECT r.candidato_id, count(*)::int AS respostas,
             count(DISTINCT q.tema_id)::int AS temas_distintos,
             count(DISTINCT r.questao_id)::int AS questoes_distintas
      FROM respostas r JOIN questoes q ON q.id = r.questao_id
      GROUP BY r.candidato_id
      HAVING count(*) > ${TEMAS}
          OR count(DISTINCT q.tema_id) <> count(*)
          OR count(DISTINCT r.questao_id) <> count(*)
      ORDER BY r.candidato_id`,
  },
  {
    id: "T04", grupo: "Tentativas", titulo: "Tentativas concluídas (12 temas encerrados)", tipo: "informativo",
    sql: `
      SELECT count(*)::int AS n FROM (
        SELECT r.candidato_id
        FROM respostas r JOIN questoes q ON q.id = r.questao_id
        WHERE ${ENCERRADA}
        GROUP BY r.candidato_id
        HAVING count(DISTINCT q.tema_id) = ${TEMAS}
      ) concluidas`,
  },
  {
    id: "T05", grupo: "Tentativas", titulo: "Respostas com horários ou campos incoerentes",
    sql: `
      SELECT r.candidato_id, r.questao_id, problema FROM (
        SELECT r.*, CASE
          WHEN r.letra_resposta IS NOT NULL AND r.data_horario_resposta IS NULL THEN 'letra registrada sem horário de resposta'
          WHEN r.data_horario_resposta < r.data_horario_inicio THEN 'resposta antes do início'
          WHEN r.data_horario_inicio > now() + INTERVAL '1 minute' THEN 'início no futuro'
          WHEN r.data_horario_resposta > now() + INTERVAL '1 minute' THEN 'resposta no futuro'
          WHEN r.data_horario_resposta IS NULL AND r.acertou IS NOT NULL THEN 'correção gravada em questão não encerrada'
          WHEN r.data_horario_resposta IS NOT NULL AND r.acertou IS NULL THEN 'questão encerrada sem correção'
        END AS problema
        FROM respostas r
      ) r
      WHERE problema IS NOT NULL
      ORDER BY r.candidato_id, r.questao_id`,
  },
  {
    id: "T06", grupo: "Tentativas", titulo: "Correção gravada diferente do gabarito",
    descricao: "acertou deve ser verdadeiro só quando a letra escolhida é a alternativa correta (o prazo é tratado à parte, pela coluna valida).",
    sql: `
      SELECT r.candidato_id, r.questao_id, r.letra_resposta,
             (SELECT a.letra FROM alternativas a WHERE a.questao_id = r.questao_id AND a.correta LIMIT 1) AS letra_correta,
             r.acertou
      FROM respostas r
      WHERE r.data_horario_resposta IS NOT NULL
        AND r.acertou IS DISTINCT FROM coalesce(
              (SELECT a.correta FROM alternativas a
                WHERE a.questao_id = r.questao_id AND a.letra = r.letra_resposta), false)
      ORDER BY r.candidato_id, r.questao_id`,
  },

  // ===== 3. Resultados e certificados (BL-16 a BL-21, RN-06 a RN-08) =====
  {
    id: "R01", grupo: "Certificados", titulo: "Certificados emitidos", tipo: "informativo",
    sql: `SELECT count(*)::int AS n FROM candidatos WHERE certificado_hash IS NOT NULL`,
  },
  {
    id: "R02", grupo: "Certificados", titulo: "Certificados com dados de emissão incompletos",
    sql: `
      SELECT c.id AS candidato_id,
             (c.certificado_hash IS NOT NULL) AS tem_codigo,
             (c.certificado_emitido_em IS NOT NULL) AS tem_data,
             (c.certificado_acertos IS NOT NULL) AS tem_acertos,
             (c.certificado_total IS NOT NULL) AS tem_total
      FROM candidatos c
      WHERE num_nonnulls(c.certificado_hash, c.certificado_emitido_em, c.certificado_acertos, c.certificado_total) NOT IN (0, 4)
      ORDER BY c.id`,
  },
  {
    id: "R03", grupo: "Certificados", titulo: "Códigos de certificado fora do formato (64 hexadecimais) ou repetidos",
    descricao: "O código em si não entra no relatório: é ele que dá acesso à validação pública.",
    sql: `
      SELECT c.id AS candidato_id,
             CASE WHEN c.certificado_hash !~ '^[0-9a-f]{64}$' THEN 'formato inválido'
                  ELSE 'código repetido' END AS problema
      FROM candidatos c
      WHERE c.certificado_hash IS NOT NULL
        AND (c.certificado_hash !~ '^[0-9a-f]{64}$'
             OR (SELECT count(*) FROM candidatos o WHERE o.certificado_hash = c.certificado_hash) > 1)
      ORDER BY c.id`,
  },
  {
    id: "R04", grupo: "Certificados", titulo: "Certificados incompatíveis com o resultado recalculado",
    descricao: `Recalcula a partir das respostas: 12 temas encerrados, acertos dentro do prazo e aproveitamento ≥ ${PERCENTUAL_MINIMO}%.`,
    sql: `
      WITH resultado AS (
        SELECT r.candidato_id,
               count(DISTINCT q.tema_id) FILTER (WHERE ${ENCERRADA})::int AS encerrados,
               count(DISTINCT q.tema_id) FILTER (WHERE ${ENCERRADA} AND ${ACERTOU})::int AS acertos,
               max(coalesce(r.data_horario_resposta, r.data_horario_inicio + ${PRAZO})) AS ultima_resposta
        FROM respostas r JOIN questoes q ON q.id = r.questao_id
        GROUP BY r.candidato_id
      ),
      total AS (SELECT count(*)::int AS n FROM temas t WHERE EXISTS (SELECT 1 FROM questoes q WHERE q.tema_id = t.id))
      SELECT c.id AS candidato_id,
             c.certificado_acertos AS acertos_gravados, coalesce(res.acertos, 0) AS acertos_recalculados,
             c.certificado_total AS total_gravado, total.n AS total_temas,
             coalesce(res.encerrados, 0) AS temas_encerrados,
             concat_ws('; ',
               CASE WHEN coalesce(res.encerrados, 0) < total.n THEN 'emitido sem concluir os temas' END,
               CASE WHEN c.certificado_acertos IS DISTINCT FROM coalesce(res.acertos, 0) THEN 'acertos diferentes do recalculado' END,
               CASE WHEN c.certificado_total IS DISTINCT FROM total.n THEN 'total diferente do número de temas' END,
               CASE WHEN c.certificado_total > 0
                     AND c.certificado_acertos * 100.0 / c.certificado_total < ${PERCENTUAL_MINIMO}
                    THEN 'aproveitamento gravado abaixo de ${PERCENTUAL_MINIMO}%' END,
               CASE WHEN c.certificado_emitido_em < res.ultima_resposta THEN 'emitido antes da última resposta' END
             ) AS problema
      FROM candidatos c
      CROSS JOIN total
      LEFT JOIN resultado res ON res.candidato_id = c.id
      WHERE c.certificado_hash IS NOT NULL
        AND (coalesce(res.encerrados, 0) < total.n
             OR c.certificado_acertos IS DISTINCT FROM coalesce(res.acertos, 0)
             OR c.certificado_total IS DISTINCT FROM total.n
             OR (c.certificado_total > 0 AND c.certificado_acertos * 100.0 / c.certificado_total < ${PERCENTUAL_MINIMO})
             OR c.certificado_emitido_em < res.ultima_resposta)
      ORDER BY c.id`,
  },
  {
    id: "R05", grupo: "Certificados", titulo: "Aprovados ainda sem certificado", severidade: "aviso",
    descricao: "Não é erro de dados: o certificado é emitido quando o candidato abre a página de resultado. Serve para conferir a emissão.",
    sql: `
      SELECT r.candidato_id,
             count(DISTINCT q.tema_id) FILTER (WHERE ${ACERTOU})::int AS acertos
      FROM respostas r
      JOIN questoes q ON q.id = r.questao_id
      JOIN candidatos c ON c.id = r.candidato_id
      WHERE c.certificado_hash IS NULL AND ${ENCERRADA}
      GROUP BY r.candidato_id
      HAVING count(DISTINCT q.tema_id) = ${TEMAS}
         AND count(DISTINCT q.tema_id) FILTER (WHERE ${ACERTOU}) * 100.0 / ${TEMAS} >= ${PERCENTUAL_MINIMO}
      ORDER BY r.candidato_id`,
  },
];

// ===== Arquivos (imagens e materiais) =====

// Devolve a descrição do problema, ou null se o arquivo está ok
function problemaArquivo(relativo, extensoes) {
  if (!relativo || !relativo.trim()) return "caminho vazio";
  const absoluto = path.resolve(RAIZ, relativo);
  if (!absoluto.startsWith(RAIZ + path.sep)) return "caminho fora do repositório";
  if (!extensoes.includes(path.extname(absoluto).toLowerCase())) return "extensão inesperada";
  if (!existsSync(absoluto)) return "arquivo não encontrado";
  return null;
}

// Lê o mapa MATERIAIS (id do tema -> PDF) de area-estudos.js
function lerMateriais() {
  const fonte = readFileSync(path.join(RAIZ, "FrontEnd/Scripts/area-estudos.js"), "utf8");
  const bloco = fonte.match(/const MATERIAIS\s*=\s*\{([\s\S]*?)\}/);
  const materiais = {};
  if (!bloco) return materiais;
  for (const [, id, arquivo] of bloco[1].matchAll(/(\d+)\s*:\s*["']([^"']+)["']/g)) {
    materiais[Number(id)] = arquivo;
  }
  return materiais;
}

// ===== Execução =====

async function executar(cliente, v) {
  const { rows } = await cliente.query(v.sql);
  if (v.tipo === "contagem" || v.tipo === "informativo") {
    const encontrado = rows[0]?.n ?? 0;
    const ok = v.tipo === "informativo" || encontrado === v.esperado;
    return { ...v, esperado: v.tipo === "informativo" ? "—" : v.esperado, encontrado, ok, ocorrencias: [] };
  }
  const ocorrencias = v.filtrar ? v.filtrar(rows) : rows;
  return { ...v, esperado: 0, encontrado: ocorrencias.length, ok: ocorrencias.length === 0, ocorrencias };
}

function situacao(r) {
  if (r.tipo === "informativo") return "ℹ️ Informativo";
  if (r.ok) return "✅ OK";
  return r.severidade === "aviso" ? "⚠️ Aviso" : "❌ Inconsistente";
}

// ===== Relatório =====

const celula = (valor) => {
  if (valor === null || valor === undefined) return "—";
  if (valor instanceof Date) return valor.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  if (typeof valor === "boolean") return valor ? "sim" : "não";
  return String(valor).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
};

function tabela(linhas) {
  const colunas = Object.keys(linhas[0]);
  const visiveis = linhas.slice(0, LIMITE_LINHAS);
  const md = [
    `| ${colunas.join(" | ")} |`,
    `| ${colunas.map(() => "---").join(" | ")} |`,
    ...visiveis.map((l) => `| ${colunas.map((c) => celula(l[c])).join(" | ")} |`),
  ];
  if (linhas.length > LIMITE_LINHAS) {
    md.push("", `_Mostrando ${LIMITE_LINHAS} de ${linhas.length} ocorrências. Rode a consulta do apêndice para ver todas._`);
  }
  return md.join("\n");
}

function commitAtual() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: RAIZ, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "desconhecido";
  }
}

function montarRelatorio(resultados, inicio) {
  const erros = resultados.filter((r) => !r.ok && r.severidade !== "aviso");
  const avisos = resultados.filter((r) => !r.ok && r.severidade === "aviso");
  const geradoEm = inicio.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const md = [
    "# QA-06 — Relatório de integridade dos dados",
    "",
    "> Gerado automaticamente por `backend/scripts/qa-integridade.js`. Não edite à mão: rode o roteiro de novo.",
    "> Procedimento e critérios em [qa-06-integridade-dados.md](qa-06-integridade-dados.md).",
    "",
    "| | |",
    "|---|---|",
    `| **Gerado em** | ${geradoEm} (horário de Brasília) |`,
    `| **Commit** | \`${commitAtual()}\` |`,
    `| **Verificações** | ${resultados.length} |`,
    `| **Resultado** | ${erros.length === 0 ? "✅ Nenhuma inconsistência" : `❌ ${erros.length} verificação(ões) com inconsistência`}${avisos.length ? ` · ⚠️ ${avisos.length} aviso(s)` : ""} |`,
    `| **Dados pessoais** | Nenhum. Candidatos aparecem só pelo id interno. |`,
    "",
    "## Resumo",
    "",
    "| ID | Grupo | Verificação | Esperado | Encontrado | Situação |",
    "|---|---|---|---|---|---|",
    ...resultados.map((r) =>
      `| ${r.ok || r.tipo ? r.id : `[${r.id}](#${r.id.toLowerCase()})`} | ${r.grupo} | ${r.titulo} | ${r.esperado} | ${r.encontrado} | ${situacao(r)} |`),
    "",
  ];

  const problemas = resultados.filter((r) => !r.ok);
  md.push("## Inconsistências", "");
  if (problemas.length === 0) {
    md.push("Nenhuma inconsistência encontrada.", "");
  }
  for (const r of problemas) {
    md.push(`### ${r.id}`, "", `**${r.titulo}** — ${situacao(r)}`, "");
    if (r.descricao) md.push(r.descricao, "");
    if (r.ocorrencias.length) {
      md.push(tabela(r.ocorrencias), "");
    } else {
      md.push(`Esperado: ${r.esperado}. Encontrado: ${r.encontrado}.`, "");
    }
  }

  md.push(
    "## Apêndice — consultas usadas",
    "",
    "Cada consulta pode ser executada direto no `psql`. As verificações C12 e C13 também conferem os arquivos no disco.",
    "",
  );
  for (const r of resultados) {
    const sql = r.sql.replace(/^\n/, "").replace(/^ {6}/gm, "").trimEnd();
    md.push(`<details><summary>${r.id} — ${r.titulo}</summary>`, "", "```sql", sql, "```", "", "</details>", "");
  }
  return md.join("\n");
}

// ===== Principal =====

function argumentoSaida() {
  const i = process.argv.indexOf("--saida");
  return i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : SAIDA_PADRAO;
}

async function principal() {
  const inicio = new Date();
  const cliente = await pool.connect();
  const resultados = [];
  try {
    await cliente.query("BEGIN TRANSACTION READ ONLY");
    await cliente.query("SET LOCAL statement_timeout = '30s'");
    for (const v of VERIFICACOES) {
      resultados.push(await executar(cliente, v));
    }
  } finally {
    await cliente.query("ROLLBACK").catch(() => {});
    cliente.release();
    await pool.end();
  }

  const saida = argumentoSaida();
  mkdirSync(path.dirname(saida), { recursive: true });
  writeFileSync(saida, montarRelatorio(resultados, inicio), "utf8");

  for (const r of resultados) {
    console.log(`${situacao(r).padEnd(16)} ${r.id}  ${r.titulo} (esperado ${r.esperado}, encontrado ${r.encontrado})`);
  }
  console.log(`\nRelatório: ${path.relative(process.cwd(), saida)}`);

  const erros = resultados.filter((r) => !r.ok && r.severidade !== "aviso").length;
  process.exitCode = erros > 0 ? 1 : 0;
}

principal().catch((erro) => {
  console.error("Falha ao executar o QA-06:", erro.message);
  process.exitCode = 2;
});
