import express from 'express';
import temas from './routes/temas.js';
import questoes from './routes/questoes.js';
import imagens from './routes/imagens.js';

//configuração do express
//criação do servidor
const app = express();
const porta = process.env.APP_PORT;

//rota para poder acessar os temas de estudo
app.use("/api/temas", temas);
app.use("/api/questoes", questoes);
app.use("/api/imagens", imagens);
//indentificação de qualquer outra rota que esteja fora das configuradas
app.use((req, res) => {
    res.send("Rota não encontrada");
});

//verificação da porta que o servidor está rodando
console.log(`Servidor rodando na porta ${porta}`);
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
