// API de certificação (backend/src/routes/certificacao.js), servida na mesma origem do front-end:
//   GET  /api/certificacao/temas
//        -> [{ id, nome, ordem, respondido, em_andamento }]
//   GET  /api/certificacao/temas/{id}/questao
//        -> { id, enunciado, imagem_url, alternativas: [{ letra, texto }],
//             segundos_restantes, correcao: Correcao | null }
//        -> 409 { tema_id } se outra questão ainda está aberta (só abre outro tema depois de concluir)
//   POST /api/certificacao/questoes/{id}/resposta   corpo: { letra: "A" | ... | null }
//        -> Correcao = { letra_resposta, letra_correta, acertou, tempo_esgotado }
// O gabarito não fica no navegador: a alternativa correta só chega depois que a resposta
// foi registrada no servidor, e o servidor decide acerto e prazo.
const API_URL = "/api";
const CHAVE_TOKEN = "multicore:token";
// imagem_url vem do banco relativo à raiz do repositório (ex.: assets/imagens/tema_1/questao_1.png)
const RAIZ_PROJETO = "../../";
const TEMPO_LIMITE_MS = 15000;
const AVISO_TEMPO_SEGUNDOS = 15;

function irParaLogin() {
    sessionStorage.removeItem(CHAVE_TOKEN);
    location.replace("login.html?expired=true");
}

const token = sessionStorage.getItem(CHAVE_TOKEN);
if (!token) irParaLogin();

async function requisitar(caminho, opcoes = {}) {
    const resposta = await fetch(API_URL + caminho, {
        ...opcoes,
        headers: { ...opcoes.headers, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    if (resposta.status === 401) {
        irParaLogin();
        throw new Error("Sessão expirada");
    }
    if (!resposta.ok) {
        const erro = new Error(`A API respondeu com status ${resposta.status}`);
        erro.status = resposta.status;
        erro.corpo = await resposta.json().catch(() => ({}));
        throw erro;
    }
    return resposta.json();
}

const api = {
    listarTemas: () => requisitar("/certificacao/temas"),
    abrirQuestao: (temaId) => requisitar(`/certificacao/temas/${temaId}/questao`),
    responder: (questaoId, letra) =>
        requisitar(`/certificacao/questoes/${questaoId}/resposta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ letra }),
        }),
};

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
    btnPausar: $("btn-pausar"),
    btnVoltar: $("btn-voltar"),
    temasDica: $("temas-dica"),
    dialogoSair: $("dialogo-sair"),
    sairTitulo: $("sair-titulo"),
    sairTexto: $("sair-texto"),
    sairErro: $("sair-erro"),
    btnSairCancelar: $("btn-sair-cancelar"),
    btnSairConfirmar: $("btn-sair-confirmar"),
    dialogoRetomar: $("dialogo-retomar"),
    retomarTexto: $("retomar-texto"),
    btnRetomar: $("btn-retomar"),
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

// Questão exibida e ainda sem resposta registrada: enquanto isso, nenhum outro tema abre
function questaoAberta() {
    return tela.questao !== null && tela.etapa !== "corrigida";
}

function renderizarTemas() {
    const enviando = tela.etapa === "enviando";
    const travado = questaoAberta();

    elementos.temasDica.textContent = travado
        ? "Conclua a questão atual para escolher outro tema."
        : "Escolha um tema para iniciar ou continuar.";

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
            botao.disabled = enviando || (travado && !atual);
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
    if (elementos.dialogoSair.open) elementos.dialogoSair.close();

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
    // A pausa só existe entre questões; depois do último tema, o botão leva ao resultado
    elementos.btnPausar.hidden = etapa !== "corrigida";
    elementos.btnPausar.textContent = proximo ? "Pausar certificação" : "Ver resultado";

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
    elementos.imagem.src = RAIZ_PROJETO + questao.imagem_url;
    elementos.imagemLink.href = RAIZ_PROJETO + questao.imagem_url;
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
        // Outra questão está aberta (ex.: tema pedido pela URL): o servidor manda concluir aquela primeiro
        const aberto = erro.status === 409 && tela.temas.find((t) => t.id === erro.corpo?.tema_id);
        if (aberto && aberto !== tema) {
            abrirTema(aberto);
            return;
        }
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

/* ===== Pausa e saída (BL-12, BL-13) ===== */
// O prazo de cada questão corre no servidor, então não dá para pausar no meio de uma:
// a pausa acontece entre questões. Sair com uma questão aberta encerra essa questão,
// registrando a alternativa marcada (sem alternativa, conta como incorreta).

function irParaInicio() {
    location.href = "menu.html";
}

function pedirSaida() {
    // Sem questão na tela (carregando, erro ou prova concluída) não há o que pausar
    if (!tela.questao) {
        irParaInicio();
        return;
    }

    const aberta = questaoAberta();
    const marcada = tela.selecionada
        ? `a alternativa <strong>${tela.selecionada}</strong>, que está marcada, será registrada como sua resposta`
        : "como nenhuma alternativa está marcada, ela contará como <strong>incorreta</strong>";

    elementos.sairTitulo.textContent = aberta ? "Sair e encerrar esta questão?" : "Pausar certificação?";
    elementos.sairTexto.innerHTML = aberta
        ? `O tempo desta questão continua contando, por isso ela não pode ficar pausada. Se sair agora, ${marcada}. Os outros temas ficam salvos para você continuar depois.`
        : "Seu progresso fica salvo. Quando voltar, você continua do próximo tema.";
    elementos.btnSairConfirmar.textContent = aberta ? "Encerrar questão e sair" : "Pausar e sair";
    elementos.sairErro.hidden = true;
    elementos.dialogoSair.showModal();
}

async function confirmarSaida() {
    // O tempo pode ter acabado com a janela aberta: aí a questão já foi encerrada
    if (questaoAberta() && tela.etapa !== "enviando") {
        elementos.btnSairConfirmar.disabled = true;
        try {
            await api.responder(tela.questao.id, tela.selecionada);
        } catch (erro) {
            console.error("Erro ao encerrar a questão:", erro);
            elementos.sairErro.hidden = false;
            elementos.btnSairConfirmar.disabled = false;
            return;
        }
    }
    irParaInicio();
}

elementos.btnVoltar.addEventListener("click", (evento) => {
    evento.preventDefault();
    pedirSaida();
});

elementos.btnPausar.addEventListener("click", () => {
    if (proximoTema()) pedirSaida();
    else location.href = "resultado.html";
});

elementos.btnSairCancelar.addEventListener("click", () => elementos.dialogoSair.close());
elementos.btnSairConfirmar.addEventListener("click", confirmarSaida);

// Clicar fora da janela de retomada equivale a escolher: a pessoa decide pelos botões
elementos.dialogoRetomar.addEventListener("cancel", (evento) => evento.preventDefault());

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

        const emAndamento = tela.temas.find((tema) => tema.em_andamento);
        const pendente = tela.temas.find((tema) => !tema.respondido);
        const concluidos = tela.temas.filter((tema) => tema.respondido).length;

        // Todos os temas respondidos: a prova acabou, o próximo passo é o resultado
        if (!pendente) {
            location.replace("resultado.html");
            return;
        }

        // Com ?tema= na URL (recarregou a página), segue direto; o servidor redireciona se outra questão estiver aberta
        const pedido = new URLSearchParams(location.search).get("tema");
        const temaPedido = tela.temas.find((tema) => String(tema.id) === pedido);
        const temaInicial = temaPedido || emAndamento || pendente;

        if (temaPedido || (concluidos === 0 && !emAndamento)) {
            abrirTema(temaInicial);
            return;
        }

        // Certificação já começada: pergunta se quer continuar de onde parou
        const progresso = `Você já concluiu ${concluidos} de ${tela.temas.length} temas.`;
        elementos.retomarTexto.textContent = emAndamento
            ? `${progresso} A questão do tema ${formatarNumero(emAndamento.ordem)} (${emAndamento.nome}) ficou aberta e o tempo dela continua contando.`
            : `${progresso} O próximo é o tema ${formatarNumero(temaInicial.ordem)}: ${temaInicial.nome}.`;
        mostrarEstado("Certificação pausada.");
        renderizarTemas();
        elementos.btnRetomar.onclick = () => {
            elementos.dialogoRetomar.close();
            abrirTema(temaInicial);
        };
        elementos.dialogoRetomar.showModal();
    } catch (erro) {
        console.error("Erro ao carregar os temas:", erro);
        mostrarEstado("Não foi possível carregar a certificação. Verifique sua conexão e tente novamente.", true);
    }
}

iniciar();
