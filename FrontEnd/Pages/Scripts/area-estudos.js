// Endereço da listagem de temas (API-04). Enquanto estiver vazio, a tela usa TEMAS_LOCAIS.
// Resposta esperada: um array de { id, nome, ordem, disponivel }. O campo "disponivel"
// é opcional: se não vier, o tema é considerado disponível.
const API_TEMAS_URL = "";
const TEMPO_LIMITE_MS = 10000;

// Nome de exemplo. Trocar pelo usuário logado quando houver sessão.
const NOME_USUARIO = "Teste";

// Progresso guardado só neste navegador, até existir uma API de progresso
const CHAVE_PROGRESSO = "multicore:temas-em-andamento";

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
const CAMINHO_MATERIAIS = "../../../assets/materiais/";
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
const resumo = document.getElementById("resumo");
const resumoTexto = document.getElementById("resumo-texto");
const resumoBarra = document.getElementById("resumo-barra");
const resumoPreenchimento = document.getElementById("resumo-preenchimento");

const emAndamento = lerProgresso();

// O navegador pode bloquear o armazenamento; nesse caso, o progresso vale só nesta visita
function lerProgresso() {
    try {
        const salvos = JSON.parse(localStorage.getItem(CHAVE_PROGRESSO));
        return new Set(Array.isArray(salvos) ? salvos.map(String) : []);
    } catch {
        return new Set();
    }
}

function salvarProgresso() {
    try {
        localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify([...emAndamento]));
    } catch (erro) {
        console.warn("Não foi possível salvar o progresso:", erro);
    }
}

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

function mostrarEstado(mensagem, { carregando = false, podeTentarNovamente = false } = {}) {
    estadoMensagem.textContent = mensagem;
    estado.classList.toggle("carregando", carregando);
    btnTentarNovamente.hidden = !podeTentarNovamente;
    estado.hidden = false;
    listaTemas.hidden = true;
    resumo.hidden = true;
}

function temaDisponivel(tema) {
    return tema.disponivel !== false && Boolean(MATERIAIS[tema.id]);
}

function atualizarProgressoDoTema(item, tema) {
    const andamento = emAndamento.has(String(tema.id));
    const acao = andamento ? "Continuar" : "Iniciar";

    item.classList.toggle("em-andamento", andamento);
    item.querySelector(".tema-status").textContent = andamento ? "Em andamento" : "Não iniciado";
    item.querySelector(".tema-link-texto").textContent = acao;
    item.querySelector(".tema-link").setAttribute("aria-label", `${acao} tema ${tema.id}: ${tema.nome}`);
}

function atualizarResumo(temas) {
    const quantidade = temas.filter((tema) => temaDisponivel(tema) && emAndamento.has(String(tema.id))).length;

    resumoTexto.textContent = `${quantidade} de ${temas.length} em andamento`;
    resumoBarra.setAttribute("aria-valuemax", temas.length);
    resumoBarra.setAttribute("aria-valuenow", quantidade);
    resumoPreenchimento.style.width = `${(quantidade / temas.length) * 100}%`;
}

function criarTema(tema, temas) {
    const item = modeloTema.content.cloneNode(true).querySelector(".tema");

    item.querySelector(".tema-numero").textContent = `TEMA ${String(tema.id).padStart(2, "0")}`;
    item.querySelector(".tema-nome").textContent = tema.nome;

    if (!temaDisponivel(tema)) {
        item.classList.add("indisponivel");
        item.querySelector(".tema-status").textContent = "Indisponível";
        item.querySelector(".tema-aviso").hidden = false;
        return item;
    }

    const link = item.querySelector(".tema-link");
    link.href = CAMINHO_MATERIAIS + MATERIAIS[tema.id];
    link.hidden = false;
    link.addEventListener("click", () => {
        emAndamento.add(String(tema.id));
        salvarProgresso();
        atualizarProgressoDoTema(item, tema);
        atualizarResumo(temas);
    });
    atualizarProgressoDoTema(item, tema);

    return item;
}

function renderizarTemas(temas) {
    listaTemas.replaceChildren(...temas.map((tema) => criarTema(tema, temas)));
    atualizarResumo(temas);
    estado.hidden = true;
    listaTemas.hidden = false;
    resumo.hidden = false;
}

async function carregarTemas() {
    mostrarEstado("Carregando temas...", { carregando: true });

    try {
        const temas = prepararTemas(await buscarTemas());

        if (temas.length === 0) {
            mostrarEstado("Nenhum tema disponível no momento. Volte mais tarde.");
            return;
        }

        renderizarTemas(temas);
    } catch (erro) {
        console.error("Erro ao carregar os temas:", erro);
        mostrarEstado("Não foi possível carregar os temas. Verifique sua conexão e tente novamente.", {
            podeTentarNovamente: true,
        });
    }
}

document.getElementById("usuario-nome").textContent = NOME_USUARIO;
document.getElementById("usuario-avatar").textContent = NOME_USUARIO.charAt(0).toUpperCase();

btnTentarNovamente.addEventListener("click", carregarTemas);

carregarTemas();
