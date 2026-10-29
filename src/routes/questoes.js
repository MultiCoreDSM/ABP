import { Router } from "express";
import { buscarQuestaoService } from "../services/questoes.js";

const rotas = Router();

/*
curl http://localhost:3001/api/questoes/1 \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e"
*/
rotas.get("/:id", async function(req, res){
    const id = req.params.id;
    console.log("Req", req.candidatoId);
    const resposta = await buscarQuestaoService(id);
    res.json(resposta);
});

export default rotas;
