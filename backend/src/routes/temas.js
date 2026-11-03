import { Router } from "express";
import { buscarProximoTemaService, listarTemasService } from "../services/temas.js";
import autenticacao from "../middlewares/autenticacao.js";

const rotas = Router();

// HTTP GET http://localhost:3001/api/temas/
rotas.get("/", async function (req, res) {
    const resposta = await listarTemasService();
    res.json(resposta);
});

/*
curl http://localhost:3001/api/temas/proximo \
 -H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/proximo", autenticacao, async function (req, res) {
    const tema = await buscarProximoTemaService(req.candidatoId);

    if (tema == null) {
        return res.json({
            tema: null,
            concluido: true,
            mensagem: "Não há mais temas a serem respondidos",
        });
    }

    res.json({ tema, concluido: false });
});

export default rotas;
