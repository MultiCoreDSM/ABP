// Endereço base da API de certificação (API-08 e API-09). Enquanto estiver vazio, a tela
// usa o simulador de questao-simulador.js. Contrato esperado:
//   GET  {API_URL}/certificacao/temas
//        -> [{ id, nome, ordem, respondido }]
//   GET  {API_URL}/certificacao/temas/{id}/questao
//        -> { id, enunciado, imagem_url, alternativas: [{ letra, texto }],
//             segundos_restantes, correcao: Correcao | null }
//   POST {API_URL}/certificacao/questoes/{id}/resposta   corpo: { letra: "A" | ... | null }
//        -> Correcao = { letra_resposta, letra_correta, acertou, tempo_esgotado }
// O POST precisa ser idempotente: uma repetição devolve a resposta registrada na primeira vez.
const API_URL = "";
const TEMPO_LIMITE_MS = 15000;
const AVISO_TEMPO_SEGUNDOS = 15;

async function requisitar(caminho, opcoes = {}) {
    const resposta = await fetch(API_URL + caminho, {
        ...opcoes,
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    if (!resposta.ok) throw new Error(`A API respondeu com status ${resposta.status}`);
    return resposta.json();
}

const api = API_URL
    ? {
          listarTemas: () => requisitar("/certificacao/temas"),
          abrirQuestao: (temaId) => requisitar(`/certificacao/temas/${temaId}/questao`),
          responder: (questaoId, letra) =>
              requisitar(`/certificacao/questoes/${questaoId}/resposta`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ letra }),
              }),
      }
    : window.simuladorCertificacao;

const $ = (id) => document.getElementById(id);

const elementos = {
    temaNumero: $("tema-numero"),
    temaNome: $("tema-nome"),
    cronometro: $("cronometro"),
    cronometroValor: $("cronometro-valor"),
    estado: $("estado"),
    estadoMensagem: $("estado-mensagem"),
    btnRecarregar: $("btn-recarregar"),
    questao: $("questao"),
    enunciadoRotulo: $("enunciado-rotulo"),
    enunciadoTexto: $("enunciado-texto"),
    imagem: $("imagem"),
    imagemLink: $("imagem-link"),
    imagemErro: $("imagem-erro"),
    alternativas: $("alternativas"),
    avisoErro: $("aviso-erro"),
    btnPular: $("btn-pular"),
    resultado: $("resultado"),
    btnPrincipal: $("btn-principal"),
    btnPrincipalTexto: $("btn-principal-texto"),
    listaTemas: $("lista-temas"),
    confirmacao: $("confirmacao"),
    confirmacaoLetra: $("confirmacao-letra"),
    confirmacaoTexto: $("confirmacao-texto"),
    btnCancelar: $("btn-cancelar"),
    btnConfirmar: $("btn-confirmar"),
    modeloAlternativa: $("modelo-alternativa"),
    modeloTema: $("modelo-tema"),
};

// etapa: "respondendo" | "enviando" | "erro" | "corrigida"
const tela = {
    temas: [],
    temaAtual: null,
    questao: null,
    selecionada: null,
    etapa: "respondendo",
    tempoEsgotado: false,
    prazo: 0,
    relogio: null,
    carregamento: 0,
};

const formatarNumero = (valor) => String(valor).padStart(2, "0");

/* ===== Temas ===== */

function proximoTema() {
    const atual = tela.temas.indexOf(tela.temaAtual);
    const emOrdem = [...tela.temas.slice(atual + 1), ...tela.temas.slice(0, atual)];
    return emOrdem.find((tema) => !tema.respondido) || null;
}

function renderizarTemas() {
    const enviando = tela.etapa === "enviando";

    elementos.listaTemas.replaceChildren(
        ...tela.temas.map((tema) => {
            const item = elementos.modeloTema.content.cloneNode(true).querySelector("li");
            const botao = item.querySelector(".tema-item");
            const atual = tema === tela.temaAtual;

            item.querySelector(".tema-item-numero").textContent = formatarNumero(tema.ordem);
            item.querySelector(".tema-item-nome").textContent = tema.nome;
            item.querySelector(".tema-item-situacao").textContent = tema.respondido ? "(respondido)" : "";
            botao.classList.toggle("atual", atual);
            botao.classList.toggle("respondido", tema.respondido);
            botao.disabled = enviando;
            if (atual) botao.setAttribute("aria-current", "true");
            botao.addEventListener("click", () => {
                if (!atual) abrirTema(tema);
            });
            return item;
        }),
    );
}

/* ===== Cronômetro ===== */

function pararCronometro() {
    clearInterval(tela.relogio);
    tela.relogio = null;
}

function atualizarCronometro() {
    const restante = Math.max(0, Math.ceil((tela.prazo - Date.now()) / 1000));

    elementos.cronometroValor.textContent = `${formatarNumero(Math.floor(restante / 60))}:${formatarNumero(restante % 60)}`;
    elementos.cronometro.classList.toggle("atencao", restante <= AVISO_TEMPO_SEGUNDOS);

    if (restante === 0) encerrarPorTempo();
}

function iniciarCronometro(segundos) {
    pararCronometro();
    tela.prazo = Date.now() + segundos * 1000;
    elementos.cronometro.hidden = false;
    tela.relogio = setInterval(atualizarCronometro, 250);
    atualizarCronometro();
}

// O tempo acabou: registra a alternativa marcada, se houver, sem pedir confirmação
function encerrarPorTempo() {
    pararCronometro();
    tela.tempoEsgotado = true;
    if (elementos.confirmacao.open) elementos.confirmacao.close();

    // Se um envio já está em andamento, o servidor decide com base nele
    if (tela.etapa === "enviando") return;
    enviarResposta();
}

/* ===== Controles ===== */

function atualizarControles() {
    const { etapa, tempoEsgotado, selecionada } = tela;
    const proximo = proximoTema();

    elementos.alternativas.disabled =
        etapa === "enviando" || etapa === "corrigida" || (etapa === "erro" && tempoEsgotado);
    elementos.avisoErro.hidden = etapa !== "erro";
    elementos.btnPular.hidden = etapa === "corrigida" || !proximo;
    elementos.btnPular.disabled = etapa === "enviando";

    const textos = {
        respondendo: "Enviar resposta",
        enviando: "Enviando...",
        erro: "Tentar novamente",
        corrigida: "Próxima questão",
    };
    elementos.btnPrincipalTexto.textContent = textos[etapa];
    elementos.btnPrincipal.hidden = etapa === "corrigida" && !proximo;
    elementos.btnPrincipal.disabled = etapa === "enviando" || (etapa === "respondendo" && !selecionada);

    renderizarTemas();
}

function definirEtapa(etapa) {
    tela.etapa = etapa;
    atualizarControles();
}

/* ===== Questão ===== */

function criarAlternativa({ letra, texto }) {
    const rotulo = elementos.modeloAlternativa.content.cloneNode(true).querySelector(".alternativa");
    const entrada = rotulo.querySelector("input");

    rotulo.dataset.letra = letra;
    entrada.value = letra;
    rotulo.querySelector(".alternativa-letra").textContent = letra;
    rotulo.querySelector(".alternativa-texto").textContent = texto;
    entrada.addEventListener("change", () => {
        tela.selecionada = letra;
        definirEtapa("respondendo");
    });
    return rotulo;
}

function renderizarQuestao(tema, questao) {
    elementos.enunciadoRotulo.textContent = `QUESTÃO ${tema.ordem}`;
    elementos.enunciadoTexto.textContent = questao.enunciado;
    elementos.imagem.src = questao.imagem_url;
    elementos.imagemLink.href = questao.imagem_url;
    elementos.imagemLink.hidden = false;
    elementos.imagemErro.hidden = true;
    elementos.alternativas.querySelectorAll(".alternativa").forEach((alternativa) => alternativa.remove());
    elementos.alternativas.append(...questao.alternativas.map(criarAlternativa));
    elementos.resultado.textContent = "";
    elementos.resultado.hidden = true;
}

function mostrarEstado(mensagem, podeRecarregar = false) {
    elementos.estadoMensagem.textContent = mensagem;
    elementos.btnRecarregar.hidden = !podeRecarregar;
    elementos.estado.hidden = false;
    elementos.questao.hidden = true;
}

async function abrirTema(tema) {
    const carregamento = ++tela.carregamento;
    const temaAnterior = tela.temaAtual;

    pararCronometro();
    tela.temaAtual = tema;
    tela.questao = null;
    tela.selecionada = null;
    tela.tempoEsgotado = false;
    tela.etapa = "respondendo";

    elementos.cronometro.hidden = true;
    elementos.cronometro.classList.remove("atencao");
    elementos.temaNumero.textContent = `Tema ${formatarNumero(tema.ordem)}`;
    elementos.temaNome.textContent = tema.nome;
    document.title = `${tema.nome} | MultiCore`;
    history.replaceState(null, "", `?tema=${tema.id}`);
    window.scrollTo(0, 0);
    mostrarEstado("Carregando questão...");
    renderizarTemas();

    try {
        const questao = await api.abrirQuestao(tema.id);
        // O usuário já pode ter escolhido outro tema enquanto esta questão carregava
        if (carregamento !== tela.carregamento) return;

        tela.questao = questao;
        renderizarQuestao(tema, questao);
        elementos.estado.hidden = true;
        elementos.questao.hidden = false;
        // Ao trocar de tema, o foco vai para a nova questão; na abertura da página, fica no início
        if (temaAnterior) elementos.enunciadoTexto.focus();

        if (questao.correcao) {
            aplicarCorrecao(questao.correcao);
        } else {
            atualizarControles();
            iniciarCronometro(questao.segundos_restantes);
        }
    } catch (erro) {
        if (carregamento !== tela.carregamento) return;
        console.error("Erro ao carregar a questão:", erro);
        mostrarEstado("Não foi possível carregar a questão. Verifique sua conexão e tente novamente.", true);
    }
}

/* ===== Confirmação e envio ===== */

function abrirConfirmacao() {
    const alternativa = tela.questao.alternativas.find(({ letra }) => letra === tela.selecionada);

    elementos.confirmacaoLetra.textContent = alternativa.letra;
    elementos.confirmacaoTexto.textContent = alternativa.texto;
    elementos.confirmacao.showModal();
}

// Só exibe a correção se os dados do servidor forem válidos
function validarCorrecao(correcao) {
    const letras = tela.questao.alternativas.map(({ letra }) => letra);
    const valida =
        correcao &&
        letras.includes(correcao.letra_correta) &&
        (correcao.letra_resposta === null || letras.includes(correcao.letra_resposta)) &&
        typeof correcao.acertou === "boolean";

    if (!valida) throw new Error("A API retornou uma correção inválida");
    return correcao;
}

async function enviarResposta() {
    // A trava impede um segundo envio, por exemplo em um clique duplo
    if (tela.etapa === "enviando" || tela.etapa === "corrigida") return;
    definirEtapa("enviando");

    try {
        aplicarCorrecao(validarCorrecao(await api.responder(tela.questao.id, tela.selecionada)));
        tela.temaAtual.respondido = true;
        atualizarControles();
        elementos.alternativas.querySelector(".correta").scrollIntoView({ block: "nearest" });
    } catch (erro) {
        console.error("Erro ao enviar a resposta:", erro);
        definirEtapa("erro");
    }

    if (!elementos.btnPrincipal.hidden) elementos.btnPrincipal.focus({ preventScroll: true });
}

function textoDoResultado({ acertou, tempo_esgotado: tempoEsgotado, letra_correta: correta }) {
    if (tempoEsgotado) return `Tempo esgotado. A alternativa correta é a ${correta}.`;
    return acertou ? "Você acertou!" : `Você errou. A alternativa correta é a ${correta}.`;
}

function aplicarCorrecao(correcao) {
    const { letra_resposta: resposta, letra_correta: correta, acertou } = correcao;

    pararCronometro();
    tela.selecionada = resposta;

    elementos.alternativas.querySelectorAll(".alternativa").forEach((alternativa) => {
        const { letra } = alternativa.dataset;
        const ehCorreta = letra === correta;
        const ehErrada = letra === resposta && !ehCorreta;

        alternativa.querySelector("input").checked = letra === resposta;
        alternativa.classList.toggle("correta", ehCorreta);
        alternativa.classList.toggle("errada", ehErrada);
        alternativa.querySelector(".alternativa-marca").hidden = !ehCorreta && !ehErrada;
        alternativa.querySelector(".alternativa-marca-texto").textContent = ehCorreta
            ? acertou
                ? "Resposta correta!"
                : "Alternativa correta"
            : "Sua resposta";
    });

    if (correcao.tempo_esgotado) {
        elementos.cronometroValor.textContent = "00:00";
        elementos.cronometro.classList.add("atencao");
        elementos.cronometro.hidden = false;
    }

    elementos.resultado.textContent = textoDoResultado(correcao);
    elementos.resultado.hidden = false;
    elementos.resultado.classList.toggle("acerto", acertou);
    definirEtapa("corrigida");
}

/* ===== Eventos ===== */

elementos.btnPrincipal.addEventListener("click", () => {
    if (tela.etapa === "respondendo") abrirConfirmacao();
    else if (tela.etapa === "erro") enviarResposta();
    else if (tela.etapa === "corrigida") abrirTema(proximoTema());
});

elementos.btnPular.addEventListener("click", () => {
    const proximo = proximoTema();
    if (proximo) abrirTema(proximo);
});

// Cancelar apenas fecha a janela: a alternativa selecionada continua marcada
elementos.btnCancelar.addEventListener("click", () => elementos.confirmacao.close());

elementos.confirmacao.addEventListener("click", (evento) => {
    if (evento.target === elementos.confirmacao) elementos.confirmacao.close();
});

elementos.btnConfirmar.addEventListener("click", () => {
    elementos.confirmacao.close();
    enviarResposta();
});

elementos.imagem.addEventListener("error", () => {
    elementos.imagemLink.hidden = true;
    elementos.imagemErro.hidden = false;
});

elementos.btnRecarregar.addEventListener("click", () => {
    if (tela.temaAtual) abrirTema(tela.temaAtual);
    else iniciar();
});

/* ===== Início ===== */

async function iniciar() {
    mostrarEstado("Carregando questão...");

    try {
        const temas = await api.listarTemas();
        if (!Array.isArray(temas) || temas.length === 0) throw new Error("A API não retornou temas");

        tela.temas = [...temas].sort((a, b) => a.ordem - b.ordem);

        const pedido = new URLSearchParams(location.search).get("tema");
        const temaInicial =
            tela.temas.find((tema) => String(tema.id) === pedido) ||
            tela.temas.find((tema) => !tema.respondido) ||
            tela.temas[0];

        abrirTema(temaInicial);
    } catch (erro) {
        console.error("Erro ao carregar os temas:", erro);
        mostrarEstado("Não foi possível carregar a certificação. Verifique sua conexão e tente novamente.", true);
    }
}

iniciar();
