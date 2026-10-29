import {Router} from "express";
import {buscarQuestaoService} from "../services/questoes.js";

const rotas = Router();

/* 
curl http://localhost:3001/api/questoes/1 \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/:id", async function(req, res){
    const id = req.params.id;
    const resposta = await buscarQuestaoService(id);
    res.json(resposta);
});

/* 
curl -X POST http://localhost:3001/api/questoes/sortear/ \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.post("/sortear", async function(req, res) {
    const questao = await sortearQuestaoService(req.candidatoId);
    res.json({questao, concluido: questao == null});
});



export default rotas;
