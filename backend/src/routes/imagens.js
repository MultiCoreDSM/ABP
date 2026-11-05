import {Router} from "express";
import {buscarImagemPathService} from "../services/imagens.js";

const rotas = Router();

/* 
http get  http://localhost:3001/api/imagens/1 \
*/
rotas.get("/:id", async function(req, res){
    const id = req.params.id;
    const filePath = await buscarImagemPathService(id);
    res.sendFile(filePath,{ root: './' });
});


export default rotas;