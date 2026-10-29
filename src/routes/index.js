import { Router } from "express";
import temas from "./temas.js";
import questoes from "./questoes.js";
import imagens from "./imagens.js";
import candidatos from "./candidatos.js";
import login from "./login.js";
import autenticacao from "../middlewares/autenticacao.js";

const rotas = Router();

rotas.use("/temas", temas);
rotas.use("/questoes", autenticacao, questoes);
rotas.use("/imagens", imagens);
rotas.use("/candidatos", candidatos);
rotas.use("/login", login);

export default rotas;
