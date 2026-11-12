// Respostas e correções dos temas já encerrados (a API não manda temas em andamento)
const $ = (id) => document.getElementById(id);
let respostas = [];

if (MultiCore.exigirLogin()) carregar();

function criarAlternativa(alternativa, classe, rotulo) {
    const item = document.createElement("li");
    item.className = `alternativa ${classe}`;
    item.innerHTML = '<span class="alternativa-letra"></span><span class="alternativa-texto"></span><span class="alternativa-rotulo"></span>';
    item.querySelector(".alternativa-letra").textContent = alternativa.letra;
    item.querySelector(".alternativa-texto").textContent = alternativa.texto;
    item.querySelector(".alternativa-rotulo").textContent = rotulo;
    return item;
}

function criarCartao(resposta) {
    const cartao = $("modelo-resposta").content.cloneNode(true).querySelector(".resposta");
    cartao.querySelector(".tema-numero").textContent = MultiCore.doisDigitos(resposta.tema.ordem);
    cartao.querySelector(".tema-nome").textContent = resposta.tema.nome;
    cartao.querySelector(".enunciado").textContent = resposta.enunciado;

    const etiqueta = cartao.querySelector(".etiqueta");
    etiqueta.classList.add(resposta.acertou ? "etiqueta-sucesso" : "etiqueta-erro");
    etiqueta.textContent = resposta.acertou ? "Correta" : "Incorreta";

    // Mostra a alternativa escolhida e, se errou, também a correta (como no design)
    const lista = cartao.querySelector(".alternativas");
    const porLetra = (letra) => resposta.alternativas.find((a) => a.letra === letra);
    const correta = porLetra(resposta.letra_correta);
    const escolhida = resposta.letra_resposta ? porLetra(resposta.letra_resposta) : null;

    if (escolhida && resposta.acertou) {
        lista.append(criarAlternativa(escolhida, "correta", "Sua resposta · correta"));
    } else {
        if (escolhida) {
            const rotulo = resposta.tempo_esgotado ? "Sua resposta · fora do prazo" : "Sua resposta";
            lista.append(criarAlternativa(escolhida, escolhida === correta ? "correta" : "errada", rotulo));
        } else {
            const aviso = document.createElement("li");
            aviso.className = "sem-resposta";
            aviso.textContent = resposta.tempo_esgotado
                ? "O tempo acabou sem alternativa marcada."
                : "Questão encerrada sem alternativa marcada.";
            lista.append(aviso);
        }
        if (escolhida !== correta) lista.append(criarAlternativa(correta, "correta", "Resposta correta"));
    }
    return cartao;
}

function filtrar(filtro) {
    document.querySelectorAll(".aba").forEach((aba) => aba.setAttribute("aria-pressed", String(aba.dataset.filtro === filtro)));
    const visiveis = respostas.filter((r) => filtro === "todas" || (filtro === "corretas" ? r.acertou : !r.acertou));

    $("grade").replaceChildren(...visiveis.map(criarCartao));
    $("estado").hidden = visiveis.length > 0;
    if (visiveis.length === 0) {
        $("estado").textContent = respostas.length === 0
            ? "Você ainda não respondeu nenhum tema."
            : "Nenhuma resposta neste filtro.";
    }
}

document.querySelectorAll(".aba").forEach((aba) => aba.addEventListener("click", () => filtrar(aba.dataset.filtro)));

async function carregar() {
    try {
        respostas = await MultiCore.api("/certificacao/respostas");
        const corretas = respostas.filter((r) => r.acertou).length;
        $("contagem").textContent = `${corretas} ${corretas === 1 ? "correta" : "corretas"} · ${respostas.length - corretas} ${respostas.length - corretas === 1 ? "incorreta" : "incorretas"}`;
        filtrar("todas");
    } catch (erro) {
        console.error("Erro ao carregar as respostas:", erro.message);
        $("contagem").textContent = "";
        $("estado").textContent = "Não foi possível carregar as respostas. Verifique sua conexão e tente novamente.";
        $("estado").hidden = false;
    }
}
