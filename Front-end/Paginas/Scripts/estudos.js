/* Tela "Área de estudos" (Figma: Desktop - 3).
   Lista de temas em acordeão; "Iniciar" abre o leitor de material. */

const PAGINA_LEITOR = "material.html";

// Temas (iguais ao seed.sql)
const TEMAS = [
  { id: 1, nome: "Fundamentos da Agilidade" },
  { id: 2, nome: "Manifesto Ágil" },
  { id: 3, nome: "Introdução ao Scrum" },
  { id: 4, nome: "Papéis do Scrum" },
  { id: 5, nome: "Eventos do Scrum" },
  { id: 6, nome: "Artefatos do Scrum" },
  { id: 7, nome: "User Stories" },
  { id: 8, nome: "Gestão do Product Backlog" },
  { id: 9, nome: "Kanban" },
  { id: 10, nome: "Planejamento Ágil" },
  { id: 11, nome: "Métricas Ágeis" },
  { id: 12, nome: "Qualidade em Projetos Ágeis" },
];

const lista = document.getElementById("acordeao");
const itens = [];

function abrir(alvo) {
  itens.forEach(({ li, botao }) => {
    const aberto = li === alvo;
    li.classList.toggle("aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
  });
}

TEMAS.forEach((tema) => {
  const li = document.createElement("li");
  li.className = "acordeao__item";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "acordeao__titulo";
  botao.setAttribute("aria-expanded", "false");
  botao.setAttribute("aria-controls", "painel-" + tema.id);

  const rotulo = document.createElement("span");
  rotulo.textContent = "Tema " + tema.id + " - " + tema.nome;

  const seta = document.createElement("span");
  seta.className = "chevron";
  seta.setAttribute("aria-hidden", "true");

  botao.append(rotulo, seta);

  const painel = document.createElement("div");
  painel.className = "acordeao__painel";
  painel.id = "painel-" + tema.id;

  const iniciar = document.createElement("a");
  iniciar.className = "botao-pilula";
  iniciar.href = PAGINA_LEITOR + "?id=" + tema.id;
  iniciar.textContent = "Iniciar";
  painel.append(iniciar);

  botao.addEventListener("click", () => {
    // clicar no tema aberto o fecha
    if (li.classList.contains("aberto")) {
      li.classList.remove("aberto");
      botao.setAttribute("aria-expanded", "false");
    } else {
      abrir(li);
    }
  });

  li.append(botao, painel);
  lista.append(li);
  itens.push({ li, botao });
});

abrir(itens[0].li); // como no Figma: Tema 1 começa aberto