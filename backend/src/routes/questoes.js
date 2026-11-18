import { Router } from "express";
import { buscarQuestaoService, sortearQuestaoService, responderQuestaoService } from "../services/questoes.js";
import autenticacao from "../middlewares/autenticacao.js";
import { capturar, idPositivo } from "../middlewares/erros.js";

const rotas = Router();

// RNF-03: toda rota de /api/questoes exige token
rotas.use(autenticacao);

/*
curl http://localhost:3001/api/questoes/1 \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/:id", capturar(async function (req, res) {
    const id = idPositivo(req.params.id);
    if (id == null) {
        return res.status(400).json({ erro: "Id de questão inválido." });
    }
    const resposta = await buscarQuestaoService(id);
    if (!resposta) {
        return res.status(404).json({ erro: "Questão não encontrada." });
    }
    res.json(resposta);
}));

/*
curl -X POST http://localhost:3001/api/questoes/sortear \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.post("/sortear", capturar(async function (req, res) {
    const questao = await sortearQuestaoService(req.candidatoId);
    res.json({ questao, concluido: questao == null });
}));

/*
curl -X POST http://localhost:3001/api/questoes/8/responder/ \
-H "Content-Type: application/json" \
-H "Authorization: Bearer SEU_TOKEN" \
-d '{"letra_resposta":"C"}'
*/
rotas.post("/:id/responder", capturar(async function (req, res) {
    const questaoId = idPositivo(req.params.id);
    if (questaoId == null) {
        return res.status(400).json({ erro: "Id de questão inválido." });
    }
    const letraResposta = req.body?.letra_resposta;
    if (!["A", "B", "C", "D"].includes(letraResposta)) {
        return res.status(400).json({ erro: "letra_resposta deve ser A, B, C ou D." });
    }
    const resposta = await responderQuestaoService(req.candidatoId, questaoId, letraResposta);
    res.json(resposta);
}));

export default rotas;
