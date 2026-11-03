import { Router } from "express";
import { buscarQuestaoService, sortearQuestaoService } from "../services/questoes.js";
import autenticacao from "../middlewares/autenticacao.js";

const rotas = Router();

/* 
curl http://localhost:3001/api/questoes/1 \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/:id", async function(req, res){
    try {
        const id = req.params.id;
        const resposta = await buscarQuestaoService(id);
        res.json(resposta);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/* 
curl -X POST http://localhost:3001/api/questoes/sortear \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.post("/sortear", autenticacao, async function(req, res) {
    try {
        const questao = await sortearQuestaoService(req.candidatoId);
        res.json({ questao, concluido: questao == null });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

export default rotas;
