import express from "express";
import temas from "./routes/temas.js";
import questoes from "./routes/questoes.js";
import imagens from "./routes/imagens.js";
import candidatos from "./routes/candidatos.js";

const porta = process.env.APP_PORT;
const app = express();
app.use(express.json());

app.use("/api/temas", temas);
app.use("/api/questoes", questoes);
app.use("/api/imagens", imagens);
app.use("/api/candidatos", candidatos);

app.use(function (req, res) {
  res.json({ error: "Rota desconhecida" });
});

app.listen(porta, function () {
  console.log(`Rodando em http://localhost:${porta}`);
});
