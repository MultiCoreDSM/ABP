import express from 'express';
import temas from './routes/temas.js';

const app = express();

const porta = process.env.APP_PORT;


app.use("/api/temas", temas);

app.use((req, res) => {
    res.send("Rota não encontrada");
});

console.log(`Servidor rodando na porta ${porta}`);
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
