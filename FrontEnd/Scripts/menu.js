// Menu principal: saudação com o primeiro nome e atalhos que mudam conforme o progresso
if (MultiCore.exigirLogin()) carregar();

document.getElementById("btn-sair").addEventListener("click", () => MultiCore.sair());

// O servidor recusa abrir questões e gravar respostas sem o aceite da versão vigente;
// aqui o candidato aceita ou vai para Meus dados (ver ou excluir a conta)
function pedirAceiteTermos() {
    const dialogo = document.getElementById("dialogo-termos");
    const form = document.getElementById("form-termos");
    const caixa = document.getElementById("aceite-termos");
    const erro = document.getElementById("erro-aceite-termos");
    const botao = document.getElementById("btn-aceitar-termos");

    // Esc não fecha: sem aceite, a prova não pode continuar
    dialogo.addEventListener("cancel", (evento) => evento.preventDefault());
    caixa.addEventListener("change", () => {
        caixa.closest(".campo").classList.remove("invalido");
        erro.textContent = "";
    });

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (!caixa.checked) {
            caixa.closest(".campo").classList.add("invalido");
            erro.textContent = "Marque a caixa para aceitar.";
            return;
        }
        botao.disabled = true;
        try {
            await MultiCore.api("/candidatos/me/termos", { method: "POST" });
            dialogo.close();
        } catch (falha) {
            console.error("Erro ao registrar o aceite:", falha.message);
            erro.textContent = "Não foi possível registrar o aceite. Tente novamente.";
        } finally {
            botao.disabled = false;
        }
    });

    dialogo.showModal();
}

async function carregar() {
    try {
        const [candidato, resultado, temas] = await Promise.all([
            MultiCore.api("/candidatos/me"),
            MultiCore.api("/certificacao/resultado"),
            MultiCore.api("/certificacao/temas"),
        ]);
        const emAndamento = temas.some((tema) => tema.em_andamento);
        if (candidato.termos_pendentes) pedirAceiteTermos();

        const nome = MultiCore.primeiroNome(candidato.nome);
        document.getElementById("saudacao-separador").textContent = nome ? ", " : "";
        document.getElementById("saudacao-nome").textContent = nome;
        document.getElementById("usuario-nome").textContent = nome;
        document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();

        // Exames: começar, continuar ou ver o resultado
        const exames = document.getElementById("opcao-exames");
        const acao = document.getElementById("exames-acao");
        const descricao = document.getElementById("exames-descricao");
        if (resultado.concluida) {
            exames.href = "resultado.html";
            acao.textContent = "Ver resultado";
            descricao.textContent = `Você concluiu os ${resultado.total} temas da certificação.`;
        } else if (resultado.respondidos > 0 || emAndamento) {
            acao.textContent = "Continuar exame";
            descricao.textContent = `${resultado.respondidos} de ${resultado.total} temas respondidos.`;
        }

        // Certificados: sem certificado emitido, o atalho leva ao resultado
        if (!resultado.concluida) {
            document.getElementById("opcao-certificados").href = "resultado.html";
            document.getElementById("certificados-descricao").textContent = "Disponível depois de concluir os 12 temas.";
        }
    } catch (erro) {
        console.error("Erro ao carregar o menu:", erro.message);
    }
}
