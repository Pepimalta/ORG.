const parametros = new URLSearchParams(window.location.search);
const tipo = parametros.get("tipo");
const itemId = parametros.get("id");

const configuracoes = {
  projetos: {
    fonte: "dados/projetos.json",
    chaveLocal: "org-projetos",
    rotulo: "Projeto",
    plural: "Projetos",
    voltar: "projetos/"
  },
  jogos: {
    fonte: "dados/jogos.json",
    chaveLocal: "org-jogos",
    rotulo: "Jogo",
    plural: "Jogos",
    voltar: "jogos/"
  },
  jornal: {
    fonte: "dados/jornal.json",
    chaveLocal: "org-jornal",
    rotulo: "Matéria",
    plural: "Matérias",
    voltar: "jornais/"
  }
};

const configuracao = configuracoes[tipo];
const carregando = document.querySelector("#detalhes-carregando");
const erro = document.querySelector("#detalhes-erro");
const conteudo = document.querySelector("#detalhes-item");

function escapar(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tituloChave(chave) {
  const especiais = {
    id: "Identificador",
    criadoEm: "Criado em",
    dataCriacao: "Data de criação",
    etapas_do_projeto: "Etapas",
    componentes_planejados: "Componentes planejados",
    materiais_esteticos: "Materiais estéticos",
    imagens_e_rascunhos: "Imagens e rascunhos",
    componentes_pesquisados_e_decisoes: "Componentes pesquisados e decisões",
    criterios_de_sucesso: "Critérios de sucesso",
    ideias_futuras: "Ideias futuras",
    forcas_e_mecanica: "Forças e mecânica"
  };
  return especiais[chave] || chave
    .replaceAll("_", " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function valorVazio(valor) {
  if (valor === null || valor === undefined || valor === "") return true;
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === "object") return Object.keys(valor).length === 0;
  return false;
}

function renderizarValor(valor) {
  if (valorVazio(valor)) return '<p class="sem-registro">Sem registro.</p>';

  if (Array.isArray(valor)) {
    return "<ul>" + valor.map(item => "<li>" + renderizarValor(item) + "</li>").join("") + "</ul>";
  }

  if (typeof valor === "object") {
    return '<div class="detalhes-aninhados">' + Object.entries(valor)
      .filter(([, conteudo]) => !valorVazio(conteudo))
      .map(([chave, conteudo]) =>
        '<section class="bloco-detalhe">' +
          "<h4>" + escapar(tituloChave(chave)) + "</h4>" +
          renderizarValor(conteudo) +
        "</section>"
      ).join("") + "</div>";
  }

  if (typeof valor === "boolean") return "<p>" + (valor ? "Sim" : "Não") + "</p>";
  return "<p>" + escapar(valor) + "</p>";
}

function bloco(titulo, valor) {
  if (valorVazio(valor)) return "";
  return '<section class="bloco-detalhe"><h3>' + escapar(titulo) + "</h3>" + renderizarValor(valor) + "</section>";
}

function normalizarDados(dados) {
  if (Array.isArray(dados)) return dados;
  if (!dados || typeof dados !== "object") return [];
  if (Array.isArray(dados[tipo])) return dados[tipo];
  if (tipo === "jornal" && Array.isArray(dados.materias)) return dados.materias;
  if (tipo === "jornal" && Array.isArray(dados.edicoes)) return dados.edicoes;
  return [];
}

function lerLocais() {
  try {
    return JSON.parse(localStorage.getItem(configuracao.chaveLocal) || "[]");
  } catch {
    return [];
  }
}

function resumoDoItem(item) {
  return item.objetivo || item.descricao || item.resumo || item.funcionamento?.resumo || "Sem resumo registrado.";
}

function montarVisaoGeral(item) {
  const campos = [
    ["Resumo", resumoDoItem(item)],
    ["Inspiração", item.inspiracao],
    ["Funcionamento", item.funcionamento],
    ["Critérios de sucesso", item.criterios_de_sucesso]
  ];
  document.querySelector("#visao-geral").innerHTML = '<div class="grade-detalhes">' +
    campos.map(([titulo, valor]) => bloco(titulo, valor)).join("") +
    "</div>";
}

function montarEtapas(item) {
  const etapas = item.etapas_do_projeto || item.etapas || [];
  document.querySelector("#etapas").innerHTML = etapas.length
    ? '<div class="grade-detalhes">' + bloco("Etapas", etapas) + "</div>"
    : '<p class="sem-registro">Nenhuma etapa registrada.</p>';
}

function montarMateriais(item) {
  const materiais = {
    componentes_planejados: item.componentes_planejados,
    materiais_esteticos: item.materiais_esteticos,
    componentes_pesquisados_e_decisoes: item.componentes_pesquisados_e_decisoes,
    materiais: item.materiais
  };
  document.querySelector("#materiais").innerHTML = '<div class="grade-detalhes">' +
    Object.entries(materiais)
      .filter(([, valor]) => !valorVazio(valor))
      .map(([chave, valor]) => bloco(tituloChave(chave), valor))
      .join("") +
    "</div>";
}

function montarImagens(item) {
  const imagens = item.imagens_e_rascunhos || item.imagens || [];
  document.querySelector("#imagens").innerHTML = valorVazio(imagens)
    ? '<p class="sem-registro">Nenhuma imagem registrada.</p>'
    : '<div class="grade-detalhes">' + bloco("Imagens e rascunhos", imagens) + "</div>";
}

function montarAnotacoes(item) {
  const anotacoes = {
    decisoes: item.decisoes,
    pendencias: item.pendencias,
    ideias_futuras: item.ideias_futuras,
    forcas_e_mecanica: item.forcas_e_mecanica,
    anotacoes: item.anotacoes
  };
  document.querySelector("#anotacoes").innerHTML = '<div class="grade-detalhes">' +
    Object.entries(anotacoes)
      .filter(([, valor]) => !valorVazio(valor))
      .map(([chave, valor]) => bloco(tituloChave(chave), valor))
      .join("") +
    "</div>";
}

function montarConteudoCompleto(item) {
  const ignorar = new Set([
    "id", "nome", "titulo", "status", "categoria", "origem",
    "descricao", "objetivo", "resumo", "inspiracao", "funcionamento",
    "criterios_de_sucesso", "etapas_do_projeto", "etapas",
    "componentes_planejados", "materiais_esteticos", "componentes_pesquisados_e_decisoes", "materiais",
    "imagens_e_rascunhos", "imagens", "decisoes", "pendencias", "ideias_futuras",
    "forcas_e_mecanica", "anotacoes"
  ]);

  const extras = Object.entries(item).filter(([chave, valor]) => !ignorar.has(chave) && !valorVazio(valor));
  document.querySelector("#conteudo-completo").innerHTML = extras.length
    ? '<div class="grade-detalhes">' + extras.map(([chave, valor]) => bloco(tituloChave(chave), valor)).join("") + "</div>"
    : '<p class="sem-registro">Todas as informações deste item já estão organizadas nas outras seções.</p>';
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

async function carregarItem() {
  if (!configuracao || !itemId) {
    carregando.hidden = true;
    erro.hidden = false;
    return;
  }

  try {
    const resposta = await fetch(configuracao.fonte + "?v=" + Date.now(), { cache: "no-store" });
    if (!resposta.ok) throw new Error("Falha ao carregar o arquivo de dados.");
    const texto = await resposta.text();
    const dados = texto.trim() ? JSON.parse(texto) : [];
    const remotos = normalizarDados(dados);
    const locais = lerLocais();
    const item = [...locais, ...remotos].find(registro => String(registro.id) === String(itemId));

    carregando.hidden = true;
    if (!item) {
      erro.hidden = false;
      return;
    }

    const titulo = item.nome || item.titulo || "Sem título";
    document.title = titulo + " | Minha Oficina";
    document.querySelector("#voltar-lista").href = configuracao.voltar;
    document.querySelector("#voltar-lista").textContent = "← Voltar para " + configuracao.plural.toLowerCase();
    document.querySelector("#titulo-item").textContent = titulo;
    document.querySelector("#status-item-detalhe").textContent = item.status || "Registrado";
    document.querySelector("#categoria-item").textContent = item.categoria || configuracao.rotulo;
    document.querySelector("#objetivo-item").textContent = resumoDoItem(item);

    montarVisaoGeral(item);
    montarConteudoCompleto(item);
    montarEtapas(item);
    montarMateriais(item);
    montarImagens(item);
    montarAnotacoes(item);
    ativarAbas();
    conteudo.hidden = false;
  } catch (falha) {
    console.error(falha);
    carregando.hidden = true;
    erro.hidden = false;
  }
}

carregarItem();