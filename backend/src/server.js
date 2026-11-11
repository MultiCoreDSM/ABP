import express from 'express';
import temas from './routes/temas.js';
import questoes from './routes/questoes.js';
import imagens from './routes/imagens.js';
import candidatos from './routes/candidatos.js';
import login from './routes/login.js';

// Configuração do express e criação do servidor
const app = express();
const porta = process.env.APP_PORT || 3001;

// Habilita recebimento de JSON no corpo das requisições
app.use(express.json());

// Rotas da API
app.use("/api/v1/temas", temas);
app.use("/api/v1/questoes", questoes);
app.use("/api/v1/imagens", imagens);
app.use("/api/v1/candidatos", candidatos);
app.use("/api/v1/login", login);

// Identificação de qualquer outra rota que esteja fora das configuradas
app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

// Inicialização do servidor
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
