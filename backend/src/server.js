import express from 'express';
import path from 'node:path';
import temas from './routes/temas.js';
import questoes from './routes/questoes.js';
import imagens from './routes/imagens.js';
import candidatos from './routes/candidatos.js';
import login from './routes/login.js';
import certificacao from './routes/certificacao.js';
import certificados from './routes/certificados.js';
import { tratarErros } from './middlewares/erros.js';

// Sem segredo o login quebraria só na primeira tentativa; melhor não subir
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET não definido no .env. O servidor não foi iniciado.");
    process.exit(1);
}

// Configuração do express e criação do servidor
const app = express();
const porta = process.env.APP_PORT || 3001;
const RAIZ_PROJETO = path.resolve(import.meta.dirname, "../..");

app.disable("x-powered-by");

// Habilita recebimento de JSON no corpo das requisições
app.use(express.json());

// Front-end e imagens servidos pela mesma origem da API (dispensa CORS).
// Só estas duas pastas: o resto do repositório (seed com gabarito, .env) não é exposto.
app.use("/FrontEnd", express.static(path.join(RAIZ_PROJETO, "FrontEnd")));
app.use("/assets", express.static(path.join(RAIZ_PROJETO, "assets")));
app.get("/", (req, res) => res.redirect("/FrontEnd/Pages/inicial.html"));

// Rotas da API
app.use("/api/temas", temas);
app.use("/api/questoes", questoes);
app.use("/api/imagens", imagens);
app.use("/api/candidatos", candidatos);
app.use("/api/login", login);
app.use("/api/certificacao", certificacao);
app.use("/api/certificados", certificados);

// Identificação de qualquer outra rota que esteja fora das configuradas
app.use((req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

// Tratamento final de erros: resposta genérica, detalhe só no log do servidor
app.use(tratarErros);

// Inicialização do servidor
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
