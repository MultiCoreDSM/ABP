// Histórico do candidato (BL-22): estatísticas e linha do tempo montadas a partir
// das respostas registradas, do certificado e da data de criação da conta.
const $ = (id) => document.getElementById(id);
let eventos = [];

const ICONES = {
    certificado: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    correta: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    incorreta: '<path d="M6 6l12 12M18 6 6 18"/>',
    conta: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
};

if (MultiCore.exigirLogin()) carregar();

function criarEvento(evento) {
    const item = document.createElement("li");
    item.className = `evento evento-${evento.tipo}`;
    item.innerHTML = `
        <span class="evento-icone" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[evento.tipo]}</svg></span>
        <div class="evento-texto"><strong></strong><span></span></div>
        <time class="evento-data"></time>`;
    item.querySelector("strong").textContent = evento.titulo;
    item.querySelector(".evento-texto span").textContent = evento.descricao;
    const data = item.querySelector("time");
    data.textContent = MultiCore.dataRelativa(evento.data);
    data.dateTime = new Date(evento.data).toISOString();
    data.title = MultiCore.formatarData(evento.data, true);

    if (evento.link) {
        const link = document.createElement("a");
        link.className = "evento-link";
        link.href = evento.link;
        link.setAttribute("aria-label", `Ver detalhes: ${evento.titulo}`);
        link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
        item.append(link);
    } else {
        const vazio = document.createElement("span");
        vazio.className = "evento-sem-link";
        item.append(vazio);
    }
    return item;
}

function filtrar(filtro) {
    document.querySelectorAll(".aba").forEach((aba) => aba.setAttribute("aria-pressed", String(aba.dataset.filtro === filtro)));
    const visiveis = eventos.filter((e) => filtro === "todos" || e.exame);
    $("linha-tempo").replaceChildren(...visiveis.map(criarEvento));
    $("estado").hidden = visiveis.length > 0;
    $("estado").textContent = "Nenhuma atividade de exame ainda. Comece pelo menu, em Exames.";
}

document.querySelectorAll(".aba").forEach((aba) => aba.addEventListener("click", () => filtrar(aba.dataset.filtro)));

async function carregar() {
    try {
        const [candidato, respostas, certificado] = await Promise.all([
            MultiCore.api("/candidatos/me"),
            MultiCore.api("/certificacao/respostas"),
            MultiCore.api("/candidatos/certificado").catch((erro) => {
                if (erro.status === 404) return null; // ainda sem certificado
                throw erro;
            }),
        ]);

        // Estatísticas
        const acertos = respostas.filter((r) => r.acertou).length;
        $("est-certificacoes").textContent = certificado ? 1 : 0;
        $("est-certificacoes-rotulo").textContent = certificado ? "Certificação concluída" : "Certificações concluídas";
        $("est-temas").textContent = respostas.length;
        $("est-aproveitamento").textContent = respostas.length ? `${MultiCore.percentual(acertos, respostas.length)}%` : "—";

        // Linha do tempo, da mais recente para a mais antiga
        eventos = respostas.map((r) => ({
            tipo: r.acertou ? "correta" : "incorreta",
            titulo: `Tema ${r.tema.ordem} · ${r.tema.nome}`,
            descricao: `Questão respondida · ${r.acertou ? "Correta" : r.tempo_esgotado ? "Tempo esgotado" : "Incorreta"}`,
            data: r.respondida_em,
            link: "respostas.html",
            exame: true,
        }));
        if (certificado) {
            eventos.push({
                tipo: "certificado",
                titulo: "Certificação concluída",
                descricao: `Metodologias Ágeis · ${certificado.acertos} de ${certificado.total} (${certificado.percentual}%) · Aprovado`,
                data: certificado.emitido_em,
                link: "certificado.html",
                exame: true,
            });
        }
        eventos.push({
            tipo: "conta",
            titulo: "Conta criada",
            descricao: "Cadastro realizado com sucesso",
            data: candidato.criado_em,
            exame: false,
        });
        eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

        filtrar("todos");
    } catch (erro) {
        console.error("Erro ao carregar o histórico:", erro.message);
        $("estado").textContent = "Não foi possível carregar o histórico. Verifique sua conexão e tente novamente.";
        $("estado").hidden = false;
    }
}
