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
import { situacaoTermosService } from "../services/candidatos.js";

const rotas = Router();

// Todas as rotas da prova exigem token (RNF-03); o candidato vem sempre do token
rotas.use(autenticacao);

// Rotas que gravam respostas: só com os termos vigentes aceitos (LGPD, art. 8º).
// Também barra um token emitido antes de a conta ser excluída.
const exigirTermos = capturar(async function (req, res, next) {
  const situacao = await situacaoTermosService(req.candidatoId);
  if (!situacao) {
    return res.status(401).json({ erro: "Conta não encontrada." });
  }
  if (situacao.pendentes) {
    return res.status(403).json({
      erro: "Aceite os Termos de Uso e a Política de Privacidade para continuar.",
      termos_pendentes: true,
    });
  }
  next();
});

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
rotas.get("/temas/:id/questao", exigirTermos, capturar(async function (req, res) {
  const temaId = idPositivo(req.params.id);
  if (temaId == null) {
    return res.status(400).json({ erro: "Id de tema inválido." });
  }
  const questao = await abrirQuestaoTemaService(req.candidatoId, temaId);
  if (!questao) {
    return res.status(404).json({ erro: "Tema não encontrado." });
  }
  if (questao.invalido) {
    return res.status(422).json({ erro: questao.erro });
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
rotas.post("/questoes/:id/resposta", exigirTermos, capturar(async function (req, res) {
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
