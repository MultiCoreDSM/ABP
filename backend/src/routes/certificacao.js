import { Router } from "express";
import autenticacao from "../middlewares/autenticacao.js";
import { capturar, idPositivo } from "../middlewares/erros.js";
import {
  listarTemasCandidatoService,
  abrirQuestaoTemaService,
  responderQuestaoCandidatoService,
  resultadoCandidatoService,
  respostasCandidatoService,
} from "../services/certificacao.js";

const rotas = Router();

// Todas as rotas da prova exigem token (RNF-03); o candidato vem sempre do token
rotas.use(autenticacao);

/*
curl http://localhost:3001/api/certificacao/temas \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/temas", capturar(async function (req, res) {
  res.json(await listarTemasCandidatoService(req.candidatoId));
}));

/*
curl http://localhost:3001/api/certificacao/temas/1/questao \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/temas/:id/questao", capturar(async function (req, res) {
  const temaId = idPositivo(req.params.id);
  if (temaId == null) {
    return res.status(400).json({ erro: "Id de tema inválido." });
  }
  const questao = await abrirQuestaoTemaService(req.candidatoId, temaId);
  if (!questao) {
    return res.status(404).json({ erro: "Tema não encontrado." });
  }
  if (questao.bloqueado) {
    return res.status(409).json({
      erro: "Conclua a questão em andamento antes de abrir outro tema.",
      tema_id: questao.bloqueado.tema_id,
    });
  }
  res.json(questao);
}));

/*
curl -X POST http://localhost:3001/api/certificacao/questoes/8/resposta \
-H "Content-Type: application/json" \
-H "Authorization: Bearer SEU_TOKEN" \
-d '{"letra":"C"}'
*/
rotas.post("/questoes/:id/resposta", capturar(async function (req, res) {
  const questaoId = idPositivo(req.params.id);
  if (questaoId == null) {
    return res.status(400).json({ erro: "Id de questão inválido." });
  }
  const letra = req.body?.letra ?? null;
  if (letra !== null && !["A", "B", "C", "D"].includes(letra)) {
    return res.status(400).json({ erro: "letra deve ser A, B, C, D ou null." });
  }
  const correcao = await responderQuestaoCandidatoService(req.candidatoId, questaoId, letra);
  if (!correcao) {
    return res.status(404).json({ erro: "Questão não sorteada para este candidato." });
  }
  res.json(correcao);
}));

/*
curl http://localhost:3001/api/certificacao/resultado -H "Authorization: Bearer SEU_TOKEN"
-> { total, respondidos, acertos, concluida, temas: [{ id, nome, ordem, respondido, acertou }] }
*/
rotas.get("/resultado", capturar(async function (req, res) {
  res.json(await resultadoCandidatoService(req.candidatoId));
}));

/*
curl http://localhost:3001/api/certificacao/respostas -H "Authorization: Bearer SEU_TOKEN"
-> respostas e correções só dos temas já encerrados
*/
rotas.get("/respostas", capturar(async function (req, res) {
  res.json(await respostasCandidatoService(req.candidatoId));
}));

export default rotas;
