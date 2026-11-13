import { Router } from "express";
import path from "node:path";
import { buscarImagemPathService } from "../services/imagens.js";
import { capturar, idPositivo } from "../middlewares/erros.js";

const rotas = Router();

// imagem_url é gravado relativo à raiz do repositório (ex.: assets/imagens/tema_1/questao_1.png)
const RAIZ_PROJETO = path.resolve(import.meta.dirname, "../../..");

/*
http get http://localhost:3001/api/imagens/1
*/
rotas.get("/:id", capturar(async function (req, res) {
    const id = idPositivo(req.params.id);
    if (id == null) {
        return res.status(400).json({ erro: "Id de questão inválido." });
    }
    const registro = await buscarImagemPathService(id);
    if (!registro || !registro.imagem_url) {
        return res.status(404).json({ erro: "Imagem não encontrada para esta questão." });
    }
    res.sendFile(registro.imagem_url, { root: RAIZ_PROJETO }, (err) => {
        if (err && !res.headersSent) {
            res.status(404).json({ erro: "Arquivo de imagem não encontrado." });
        }
    });
}));

export default rotas;
