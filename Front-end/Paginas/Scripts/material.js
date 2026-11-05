/* ==========================================================
   FE-07 - Leitor de material
   Abra com: pages/material.html?id=1  (use o Live Server)
   ========================================================== */

/* ---------- CONFIGURAÇÃO (ajuste aqui se precisar) ---------- */

// Pasta dos materiais, relativa a pages/material.html
const PASTA_MATERIAIS = "../assets/materiais/";

// Página da lista de temas (tela "Área de estudos" do Figma)
const PAGINA_LISTA = "estudos.html";

// O leitor testa estes padrões de nome, na ordem, até achar o arquivo.
// {id} = número do tema (1 a 12). {id2} = número com dois dígitos (01, 02...).
// Se os seus arquivos tiverem outro nome, adicione o padrão aqui.
const PADROES_NOME = [
  "tema-{id}",
  "tema-{id2}",
  "tema{id}",
  "tema_{id}",
  "tema_{id2}",
  "{id}",
  "{id2}",
];

// Extensões aceitas, na ordem de tentativa
const EXTENSOES = ["md", "html", "txt"];

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

/* ---------- ELEMENTOS ---------- */

const area = document.getElementById("conteudo");
const lista = document.getElementById("lista-temas");
const btnAnterior = document.getElementById("anterior");
const btnProximo = document.getElementById("proximo");
const linkVoltar = document.getElementById("voltar");

const idAtual = Number(new URLSearchParams(window.location.search).get("id"));
const temaAtual = TEMAS.find((t) => t.id === idAtual);

linkVoltar.href = PAGINA_LISTA;

/* ---------- SEGURANÇA ---------- */

// Só aceita http, https ou caminho relativo. Bloqueia javascript:, data: etc.
function urlSegura(url, base) {
  try {
    const u = new URL(url, base);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch (e) {
    /* url inválida */
  }
  return null;
}

function ehExterna(href) {
  return new URL(href).origin !== window.location.origin;
}

function criarLink(texto, url, base) {
  const href = urlSegura(url, base);
  if (!href) return document.createTextNode(texto);
  const a = document.createElement("a");
  a.href = href;
  a.textContent = texto;
  if (ehExterna(href)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "externo";
    a.setAttribute("aria-label", texto + " (abre em nova aba)");
  }
  return a;
}

function criarImagem(alt, src, base) {
  const href = urlSegura(src, base);
  if (!href) return document.createTextNode(alt ? "[Imagem: " + alt + "]" : "");
  const img = document.createElement("img");
  img.src = href;
  img.alt = alt || ""; // alt vazio = imagem decorativa
  img.loading = "lazy";
  img.addEventListener("error", () => {
    const aviso = document.createElement("span");
    aviso.className = "aviso aviso--inline";
    aviso.textContent = alt ? "Imagem indisponível: " + alt : "Imagem indisponível.";
    img.replaceWith(aviso);
  });
  return img;
}

/* ---------- MARKDOWN SIMPLES (sem innerHTML) ---------- */

const REGEX_INLINE =
  /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

function inline(texto, base) {
  const frag = document.createDocumentFragment();
  let ultimo = 0;
  let m;
  REGEX_INLINE.lastIndex = 0;
  while ((m = REGEX_INLINE.exec(texto)) !== null) {
    if (m.index > ultimo) frag.append(texto.slice(ultimo, m.index));
    if (m[2] !== undefined) {
      frag.append(criarImagem(m[1], m[2], base));
    } else if (m[4] !== undefined) {
      frag.append(criarLink(m[3], m[4], base));
    } else if (m[5] !== undefined) {
      const el = document.createElement("strong");
      el.textContent = m[5];
      frag.append(el);
    } else if (m[6] !== undefined) {
      const el = document.createElement("em");
      el.textContent = m[6];
      frag.append(el);
    } else if (m[7] !== undefined) {
      const el = document.createElement("code");
      el.textContent = m[7];
      frag.append(el);
    }
    ultimo = REGEX_INLINE.lastIndex;
  }
  if (ultimo < texto.length) frag.append(texto.slice(ultimo));
  return frag;
}

function renderMarkdown(md, base) {
  const frag = document.createDocumentFragment();
  const linhas = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    if (linha.trim() === "") { i++; continue; }

    // bloco de código
    if (linha.trim().startsWith("```")) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      const buffer = [];
      i++;
      while (i < linhas.length && !linhas[i].trim().startsWith("```")) {
        buffer.push(linhas[i]);
        i++;
      }
      i++;
      code.textContent = buffer.join("\n");
      pre.append(code);
      frag.append(pre);
      continue;
    }

    // título
    const t = linha.match(/^(#{1,4})\s+(.*)$/);
    if (t) {
      // # no arquivo vira h2, porque o h1 é o nome do tema
      const nivel = Math.min(t[1].length + 1, 5);
      const h = document.createElement("h" + nivel);
      h.append(inline(t[2], base));
      frag.append(h);
      i++;
      continue;
    }

    // lista
    if (/^\s*([-*+]|\d+\.)\s+/.test(linha)) {
      const ordenada = /^\s*\d+\./.test(linha);
      const ul = document.createElement(ordenada ? "ol" : "ul");
      while (i < linhas.length && /^\s*([-*+]|\d+\.)\s+/.test(linhas[i])) {
        const li = document.createElement("li");
        li.append(inline(linhas[i].replace(/^\s*([-*+]|\d+\.)\s+/, ""), base));
        ul.append(li);
        i++;
      }
      frag.append(ul);
      continue;
    }

    // citação
    if (linha.startsWith(">")) {
      const bq = document.createElement("blockquote");
      const partes = [];
      while (i < linhas.length && linhas[i].startsWith(">")) {
        partes.push(linhas[i].replace(/^>\s?/, ""));
        i++;
      }
      bq.append(inline(partes.join(" "), base));
      frag.append(bq);
      continue;
    }

    // linha horizontal
    if (/^(-{3,}|\*{3,})$/.test(linha.trim())) {
      frag.append(document.createElement("hr"));
      i++;
      continue;
    }

    // parágrafo
    const partes = [];
    while (
      i < linhas.length &&
      linhas[i].trim() !== "" &&
      !/^(#{1,4}\s|```|>|\s*([-*+]|\d+\.)\s+)/.test(linhas[i])
    ) {
      partes.push(linhas[i].trim());
      i++;
    }
    const p = document.createElement("p");
    p.append(inline(partes.join(" "), base));
    frag.append(p);
  }
  return frag;
}

/* ---------- HTML COM LISTA DE TAGS PERMITIDAS ---------- */

const TAGS_OK = new Set([
  "H1","H2","H3","H4","P","UL","OL","LI","STRONG","B","EM","I",
  "BR","BLOCKQUOTE","CODE","PRE","A","IMG","HR",
]);

// DOMParser não executa scripts. Mesmo assim, só copiamos o que está na lista.
function renderHtml(html, base) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const frag = document.createDocumentFragment();

  function copiar(no, destino) {
    no.childNodes.forEach((filho) => {
      if (filho.nodeType === Node.TEXT_NODE) {
        destino.append(filho.textContent);
        return;
      }
      if (filho.nodeType !== Node.ELEMENT_NODE) return;
      const tag = filho.tagName;

      if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME") return;

      if (tag === "A") {
        const link = criarLink(filho.textContent, filho.getAttribute("href") || "", base);
        destino.append(link);
        return;
      }
      if (tag === "IMG") {
        destino.append(criarImagem(filho.getAttribute("alt") || "", filho.getAttribute("src") || "", base));
        return;
      }
      if (TAGS_OK.has(tag)) {
        const novo = document.createElement(tag.toLowerCase());
        copiar(filho, novo);
        destino.append(novo);
      } else {
        copiar(filho, destino); // tag não permitida: mantém só o conteúdo
      }
    });
  }

  copiar(doc.body, frag);
  return frag;
}

/* ---------- CARREGAR ARQUIVO ---------- */

async function buscarMaterial(id) {
  const id2 = String(id).padStart(2, "0");
  for (const padrao of PADROES_NOME) {
    const nome = padrao.replace("{id2}", id2).replace("{id}", String(id));
    for (const ext of EXTENSOES) {
      const url = new URL(PASTA_MATERIAIS + nome + "." + ext, window.location.href);
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          return { texto: await resp.text(), ext: ext, url: url.href };
        }
      } catch (e) {
        /* tenta o próximo */
      }
    }
  }
  return null;
}

/* ---------- TELA ---------- */

function mostrarAviso(mensagem) {
  const p = document.createElement("p");
  p.className = "aviso";
  p.setAttribute("role", "alert");
  p.textContent = mensagem;
  area.replaceChildren(p);
}

function montarLista() {
  TEMAS.forEach((t) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "material.html?id=" + t.id;
    a.textContent = "Tema " + t.id + " - " + t.nome;
    if (t.id === idAtual) {
      a.className = "ativo";
      a.setAttribute("aria-current", "page");
    }
    li.append(a);
    lista.append(li);
  });
}

function configurarNavegacao() {
  const valido = Boolean(temaAtual);
  btnAnterior.disabled = !valido || idAtual <= 1;
  btnProximo.disabled = !valido || idAtual >= TEMAS.length;
  btnAnterior.addEventListener("click", () => {
    window.location.href = "material.html?id=" + (idAtual - 1);
  });
  btnProximo.addEventListener("click", () => {
    window.location.href = "material.html?id=" + (idAtual + 1);
  });
}

async function iniciar() {
  montarLista();
  configurarNavegacao();

  if (!temaAtual) {
    mostrarAviso("Tema não encontrado. Escolha um tema na lista ao lado ou volte à lista de temas.");
    return;
  }

  document.title = "Tema " + temaAtual.id + " - " + temaAtual.nome + " | ABP";

  const material = await buscarMaterial(temaAtual.id);
  if (!material) {
    mostrarAviso("O material deste tema está indisponível no momento. Tente outro tema ou volte mais tarde.");
    return;
  }

  const titulo = document.createElement("h1");
  titulo.textContent = "Tema " + temaAtual.id + " - " + temaAtual.nome;

  const corpo = document.createElement("div");
  corpo.className = "texto";
  corpo.append(
    material.ext === "html"
      ? renderHtml(material.texto, material.url)
      : renderMarkdown(material.texto, material.url)
  );

  area.replaceChildren(titulo, corpo);
}

iniciar();