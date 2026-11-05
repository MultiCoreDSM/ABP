// Endereço da listagem de temas (API-04). Enquanto estiver vazio, a tela usa TEMAS_LOCAIS.
// Resposta esperada: um array de { id, nome, ordem, disponivel }. O campo "disponivel"
// é opcional: se não vier, o tema é considerado disponível.
const API_TEMAS_URL = "";
const TEMPO_LIMITE_MS = 10000;

// Mesmos dados de Database/seed.sql
const TEMAS_LOCAIS = [
    { id: 1, nome: "Fundamentos da Agilidade", ordem: 1 },
    { id: 2, nome: "Manifesto Ágil", ordem: 2 },
    { id: 3, nome: "Introdução ao Scrum", ordem: 3 },
    { id: 4, nome: "Papéis do Scrum", ordem: 4 },
    { id: 5, nome: "Eventos do Scrum", ordem: 5 },
    { id: 6, nome: "Artefatos do Scrum", ordem: 6 },
    { id: 7, nome: "User Stories", ordem: 7 },
    { id: 8, nome: "Gestão do Product Backlog", ordem: 8 },
    { id: 9, nome: "Kanban", ordem: 9 },
    { id: 10, nome: "Planejamento Ágil", ordem: 10 },
    { id: 11, nome: "Métricas Ágeis", ordem: 11 },
    { id: 12, nome: "Qualidade em Projetos Ágeis", ordem: 12 },
];

// A tabela de temas não guarda o material, então o PDF é associado pelo id do tema
const CAMINHO_MATERIAIS = "../../assets/materiais/";
const MATERIAIS = {
    1: "01-fundamentos-da-agilidade.pdf",
    2: "02-manifesto-agil.pdf",
    3: "03-introducao-ao-scrum.pdf",
    4: "04-papeis-do-scrum.pdf",
    5: "05-eventos-do-scrum.pdf",
    6: "06-artefatos-do-scrum.pdf",
    7: "07-user-stories.pdf",
    8: "08-gestao-do-product-backlog.pdf",
    9: "09-kanban.pdf",
    10: "10-planejamento-agil.pdf",
    11: "11-metricas-ageis.pdf",
    12: "12-qualidade-em-projetos-ageis.pdf",
};

const estado = document.getElementById("estado");
const estadoMensagem = document.getElementById("estado-mensagem");
const btnTentarNovamente = document.getElementById("btn-tentar-novamente");
const listaTemas = document.getElementById("lista-temas");
const modeloTema = document.getElementById("modelo-tema");

async function buscarTemas() {
    if (!API_TEMAS_URL) return TEMAS_LOCAIS;

    const resposta = await fetch(API_TEMAS_URL, {
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    if (!resposta.ok) throw new Error(`A API respondeu com status ${resposta.status}`);

    const dados = await resposta.json();
    if (!Array.isArray(dados)) throw new Error("A API não retornou uma lista de temas");
    return dados;
}

// Ignora registros incompletos e mantém a ordem documentada no campo "ordem"
function prepararTemas(temas) {
    const posicao = (tema) => (Number.isFinite(tema.ordem) ? tema.ordem : Infinity);

    return temas
        .filter((tema) => tema && tema.id != null && tema.nome)
        .sort((a, b) => (posicao(a) === posicao(b) ? 0 : posicao(a) - posicao(b)));
}

function mostrarEstado(mensagem, podeTentarNovamente = false) {
    estadoMensagem.textContent = mensagem;
    btnTentarNovamente.hidden = !podeTentarNovamente;
    estado.hidden = false;
    listaTemas.hidden = true;
}

function alternarTema(item) {
    const abrir = !item.classList.contains("aberto");

    // Apenas um tema fica aberto por vez
    listaTemas.querySelectorAll(".tema.aberto").forEach(definirFechado);

    if (abrir) {
        item.classList.add("aberto");
        item.querySelector(".tema-botao").setAttribute("aria-expanded", "true");
    }
}

function definirFechado(item) {
    item.classList.remove("aberto");
    item.querySelector(".tema-botao").setAttribute("aria-expanded", "false");
}

function criarTema(tema) {
    const item = modeloTema.content.cloneNode(true).querySelector(".tema");
    const botao = item.querySelector(".tema-botao");
    const painel = item.querySelector(".tema-painel");
    const titulo = `Tema ${tema.id} - ${tema.nome}`;
    const material = MATERIAIS[tema.id];
    const disponivel = tema.disponivel !== false && Boolean(material);

    item.querySelector(".tema-nome").textContent = titulo;

    botao.id = `tema-${tema.id}`;
    botao.setAttribute("aria-controls", `painel-tema-${tema.id}`);
    painel.id = `painel-tema-${tema.id}`;
    painel.setAttribute("aria-labelledby", botao.id);
    botao.addEventListener("click", () => alternarTema(item));

    if (disponivel) {
        const link = item.querySelector(".btn-iniciar");
        link.href = CAMINHO_MATERIAIS + material;
        link.setAttribute("aria-label", `Iniciar ${titulo}`);
        link.hidden = false;
    } else {
        item.querySelector(".tema-selo").hidden = false;
        item.querySelector(".tema-aviso").hidden = false;
    }

    return item;
}

function renderizarTemas(temas) {
    listaTemas.replaceChildren(...temas.map(criarTema));
    alternarTema(listaTemas.firstElementChild); // No design, o primeiro tema já vem aberto
    estado.hidden = true;
    listaTemas.hidden = false;
}

async function carregarTemas() {
    mostrarEstado("Carregando temas...");

    try {
        const temas = prepararTemas(await buscarTemas());

        if (temas.length === 0) {
            mostrarEstado("Nenhum tema disponível no momento.");
            return;
        }

        renderizarTemas(temas);
    } catch (erro) {
        console.error("Erro ao carregar os temas:", erro);
        mostrarEstado("Não foi possível carregar os temas.", true);
    }
}

btnTentarNovamente.addEventListener("click", carregarTemas);

carregarTemas();
