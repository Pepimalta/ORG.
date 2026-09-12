const parametros = new URLSearchParams(window.location.search);
const projetoId = parametros.get("id");

const carregando = document.querySelector("#detalhes-carregando");
const erro = document.querySelector("#detalhes-erro");
const conteudo = document.querySelector("#detalhes-projeto");

function escapar(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tituloChave(chave) {
  return chave
    .replaceAll("_", " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function lista(valores, ordenada = false) {
  if (!Array.isArray(valores) || !valores.length) return "<p>Nenhum registro.</p>";
  const tag = ordenada ? "ol" : "ul";
  return "<" + tag + ">" + valores.map(valor =>
    "<li>" + escapar(typeof valor === "string" ? valor : valor.nome || valor.material || JSON.stringify(valor)) + "</li>"
  ).join("") + "</" + tag + ">";
}

function bloco(titulo, corpo) {
  return '<section class="bloco-detalhe"><h3>' + escapar(titulo) + "</h3>" + corpo + "</section>";
}

function textoObjeto(objeto) {
  if (!objeto || typeof objeto !== "object") return "<p>" + escapar(objeto || "Sem registro.") + "</p>";

  return "<ul>" + Object.entries(objeto).map(([chave, valor]) => {
    if (Array.isArray(valor)) {
      return "<li><strong>" + escapar(tituloChave(chave)) + ":</strong>" + lista(valor) + "</li>";
    }
    if (valor && typeof valor === "object") {
      return "<li><strong>" + escapar(tituloChave(chave)) + ":</strong>" + textoObjeto(valor) + "</li>";
    }
    return "<li><strong>" + escapar(tituloChave(chave)) + ":</strong> " + escapar(valor) + "</li>";
  }).join("") + "</ul>";
}

function montarVisaoGeral(projeto) {
  const funcionamento = projeto.funcionamento || {};
  document.querySelector("#visao-geral").innerHTML =
    '<div class="grade-detalhes">' +
      bloco("Inspiração", "<p>" + escapar(projeto.inspiracao?.principal || "Sem registro.") + "</p>") +
      bloco("Funcionamento", "<p>" + escapar(funcionamento.resumo || "Sem registro.") + "</p>") +
      bloco("Sequência planejada", lista(funcionamento.sequencia, true)) +
      bloco("Critérios de sucesso", lista(projeto.criterios_de_sucesso)) +
    "</div>";
}

function montarEtapas(projeto) {
  const etapas = projeto.etapas_do_projeto || [];
  document.querySelector("#etapas").innerHTML = etapas.length
    ? '<ol class="lista-etapas">' + etapas.map(etapa =>
        '<li class="etapa-projeto">' +
          '<span class="numero-etapa">' + escapar(etapa.etapa) + "</span>" +
          "<div><h3>" + escapar(etapa.nome) + "</h3><p>" + escapar(etapa.descricao) + "</p></div>" +
          '<span class="estado-etapa">' + escapar(etapa.status) + "</span>" +
        "</li>"
      ).join("") + "</ol>"
    : bloco("Etapas", "<p>Nenhuma etapa registrada.</p>");
}

function montarMateriais(projeto) {
  const componentes = projeto.componentes_planejados || [];
  const esteticos = projeto.materiais_esteticos?.opcoes || [];
  const pesquisados = projeto.componentes_pesquisados_e_decisoes || [];

  const cardsEsteticos = esteticos.map(item =>
    '<li class="material-item"><strong>' + escapar(item.material) + "</strong><p>" +
    escapar(item.uso || "") + "</p><small>" + escapar(item.vantagem || "") + "</small></li>"
  ).join("");

  const cardsPesquisados = pesquisados.map(item =>
    '<li class="material-item"><strong>' + escapar(item.componente) + "</strong><p>" +
    escapar(item.decisao || "") + "</p></li>"
  ).join("");

  document.querySelector("#materiais").innerHTML =
    bloco("Componentes planejados", lista(componentes)) +
    '<div class="grade-detalhes" style="margin-top:22px">' +
      bloco("Materiais de estrutura e acabamento", esteticos.length ? '<ul class="lista-materiais">' + cardsEsteticos + "</ul>" : "<p>Nenhum material registrado.</p>") +
      bloco("Componentes pesquisados", pesquisados.length ? '<ul class="lista-materiais">' + cardsPesquisados + "</ul>" : "<p>Nenhum componente pesquisado.</p>") +
    "</div>";
}

function montarImagens(projeto) {
  const imagens = projeto.imagens_e_rascunhos || {};
  document.querySelector("#imagens").innerHTML =
    '<div class="grade-detalhes">' +
      bloco("Imagens e rascunhos", lista(imagens.descricao)) +
      bloco("Observação", "<p>" + escapar(imagens.observacao || "Nenhuma imagem adicionada ao repositório.") + "</p>") +
    "</div>";
}

function montarAnotacoes(projeto) {
  document.querySelector("#anotacoes").innerHTML =
    '<div class="grade-detalhes">' +
      bloco("Decisões", textoObjeto(projeto.decisoes)) +
      bloco("Pendências", lista(projeto.pendencias)) +
      bloco("Ideias futuras", lista(projeto.ideias_futuras)) +
      bloco("Forças e mecânica", textoObjeto(projeto.forcas_e_mecanica)) +
    "</div>";
}

function ativarAbas() {
  document.querySelectorAll(".aba-detalhe").forEach(botao => {
    botao.addEventListener("click", () => {
      document.querySelectorAll(".aba-detalhe").forEach(item => item.classList.remove("ativa"));
      document.querySelectorAll(".painel-detalhe").forEach(item => item.classList.remove("ativo"));
      botao.classList.add("ativa");
      document.querySelector("#" + botao.dataset.painel).classList.add("ativo");
    });
  });
}

async function carregarProjeto() {
  try {
    const resposta = await fetch("../dados/projetos.json?v=" + Date.now(), { cache: "no-store" });
    if (!resposta.ok) throw new Error("Falha ao carregar projetos");
    const remotos = await resposta.json();
    const locais = JSON.parse(localStorage.getItem("org-projetos") || "[]");
    const projeto = [...locais, ...(Array.isArray(remotos) ? remotos : remotos.projetos || [])]
      .find(item => String(item.id) === String(projetoId));

    carregando.hidden = true;
    if (!projeto) {
      erro.hidden = false;
      return;
    }

    document.title = (projeto.nome || projeto.titulo) + " | Minha Oficina";
    document.querySelector("#titulo-projeto").textContent = projeto.nome || projeto.titulo;
    document.querySelector("#status-projeto").textContent = projeto.status || "Registrado";
    document.querySelector("#categoria-projeto").textContent = projeto.categoria || "Projeto";
    document.querySelector("#objetivo-projeto").textContent =
      projeto.objetivo || projeto.descricao || "Sem objetivo registrado.";

    montarVisaoGeral(projeto);
    montarEtapas(projeto);
    montarMateriais(projeto);
    montarImagens(projeto);
    montarAnotacoes(projeto);
    ativarAbas();
    conteudo.hidden = false;
  } catch (falha) {
    console.error(falha);
    carregando.hidden = true;
    erro.hidden = false;
  }
}

carregarProjeto();