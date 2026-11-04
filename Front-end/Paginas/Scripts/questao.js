const formResposta = document.getElementById("formResposta");
const alternativas = document.getElementById("alternativas");
const botaoConfirmar = document.getElementById("confirmarResposta");
const botaoLimpar = document.getElementById("limparResposta");
const mensagem = document.getElementById("mensagem");

const barraProgresso = document.getElementById("barraProgresso");
const progressoPreenchimento = document.getElementById("progressoPreenchimento");
const textoProgresso = document.getElementById("textoProgresso");

const respostaRegistrada = document.getElementById("respostaRegistrada");
const areaImagem = document.getElementById("areaImagem");
const imagemQuestao = document.getElementById("imagemQuestao");

// Questão demonstrativa.
// Depois, estes dados serão substituídos pelos dados reais da tentativa.
const questao = {
    id: "questao-demo-01",
    imagem: "",
    alternativas: ["a", "b", "c", "d"]
};

const chaveArmazenamento = `abp-resposta-${questao.id}`;

function obterRespostaSalva() {
    try {
        const dados = localStorage.getItem(chaveArmazenamento);
        return dados ? JSON.parse(dados) : null;
    } catch (erro) {
        console.error("Não foi possível recuperar a resposta:", erro);
        return null;
    }
}

function exibirImagem() {
    if (!questao.imagem) {
        areaImagem.hidden = true;
        return;
    }

    imagemQuestao.src = questao.imagem;
    areaImagem.hidden = false;

    imagemQuestao.onerror = () => {
        areaImagem.hidden = true;
    };
}

function atualizarProgresso(concluida) {
    const porcentagem = concluida ? 100 : 0;

    textoProgresso.textContent = `${porcentagem}% concluído`;
    progressoPreenchimento.style.width = `${porcentagem}%`;
    barraProgresso.setAttribute("aria-valuenow", porcentagem);
}

function bloquearQuestao(resposta) {
    const opcoes = formResposta.querySelectorAll(
        'input[name="resposta"]'
    );

    opcoes.forEach((opcao) => {
        opcao.disabled = true;
        opcao.checked = opcao.value === resposta;
    });

    botaoConfirmar.disabled = true;
    botaoLimpar.disabled = true;

    respostaRegistrada.hidden = false;
    mensagem.textContent = "Questão encerrada. A resposta não pode ser alterada.";

    atualizarProgresso(true);
}

function carregarEstadoInicial() {
    exibirImagem();

    const respostaSalva = obterRespostaSalva();

    if (respostaSalva && questao.alternativas.includes(respostaSalva.resposta)) {
        bloquearQuestao(respostaSalva.resposta);
        return;
    }

    atualizarProgresso(false);
}

formResposta.addEventListener("change", (evento) => {
    if (evento.target.name !== "resposta") {
        return;
    }

    mensagem.textContent = "Alternativa selecionada. Confira antes de confirmar.";
    mensagem.classList.remove("erro");
});

botaoLimpar.addEventListener("click", () => {
    const respostaSalva = obterRespostaSalva();

    if (respostaSalva) {
        return;
    }

    formResposta.reset();

    mensagem.textContent = "Escolha uma alternativa para continuar.";
    mensagem.classList.remove("erro");
});

formResposta.addEventListener("submit", (evento) => {
    evento.preventDefault();

    // Evita registrar novamente uma questão já encerrada.
    if (obterRespostaSalva()) {
        carregarEstadoInicial();
        return;
    }

    const selecionada = formResposta.querySelector(
        'input[name="resposta"]:checked'
    );

    if (!selecionada) {
        mensagem.textContent = "Selecione uma alternativa antes de continuar.";
        mensagem.classList.add("erro");
        return;
    }

    // Mantém a seleção e pede confirmação antes do registro.
    const confirmar = window.confirm(
        "Deseja confirmar esta resposta? Depois do registro, ela não poderá ser alterada."
    );

    if (!confirmar) {
        return;
    }

    const registro = {
        questaoId: questao.id,
        resposta: selecionada.value,
        registradaEm: new Date().toISOString()
    };

    try {
        // Persistência local provisória para testar a interface.
        localStorage.setItem(
            chaveArmazenamento,
            JSON.stringify(registro)
        );
    } catch (erro) {
        console.error("Não foi possível salvar a resposta:", erro);

        mensagem.textContent =
            "Não foi possível registrar a resposta neste navegador. Tente novamente.";

        mensagem.classList.add("erro");
        return;
    }

    bloquearQuestao(registro.resposta);
});

carregarEstadoInicial();