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

function cartaoProduto(produto) {
  const imagem = produto.imagem
    ? '<img class="imagem-produto" src="' + escapar(produto.imagem) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
    : '<div class="imagem-produto sem-imagem">SEM IMAGEM</div>';
  const link = produto.link
    ? '<a class="link-produto" href="' + escapar(produto.link) + '" target="_blank" rel="noopener noreferrer">Ver produto ↗</a>'
    : '<span class="link-indisponivel">Link não encontrado</span>';

  return '<article class="produto-encontrado">' +
    imagem +
    '<div class="dados-produto"><small>' + escapar(produto.loja || "Loja não informada") + '</small>' +
    '<h4>' + escapar(produto.nome || "Produto") + '</h4>' +
    '<strong class="preco-produto">' + escapar(produto.preco || "Preço não encontrado") + '</strong>' +
    link +
    (produto.observacao ? '<p>' + escapar(produto.observacao) + '</p>' : '') +
    '</div></article>';
}

function prepararPesquisaMateriais() {
  const formulario = document.querySelector("#form-pesquisa-material");
  if (!formulario) return;

  document.querySelector("#abrir-busca-externa").addEventListener("click", () => {
    const termo = document.querySelector("#pesquisa-material").value.trim();
    if (termo.length >= 2) {
      window.open("https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(termo), "_blank", "noopener");
    }
  });

  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    const campo = document.querySelector("#pesquisa-material");
    const botao = formulario.querySelector("button");
    const resultado = document.querySelector("#resultado-materiais");
    const termo = campo.value.trim();
    if (termo.length < 2) return;

    botao.disabled = true;
    botao.textContent = "Pesquisando...";
    resultado.innerHTML = '<p class="aviso-pesquisa">Procurando preços e lojas...</p>';

    try {
      const resposta = await fetch("https://org-beta-kohl.vercel.app/api/materiais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo })
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        const falha = new Error(dados.erro || "A pesquisa falhou.");
        falha.status = resposta.status;
        throw falha;
      }

      resultado.innerHTML = dados.produtos?.length
        ? '<div class="grade-produtos">' + dados.produtos.map(cartaoProduto).join("") + '</div>' +
          '<p class="nota-precos">Confira o preço, o frete e a segurança da loja antes de comprar. Os valores podem mudar.</p>'
        : '<p class="aviso-pesquisa">Nenhum produto foi encontrado.</p>';
    } catch (falha) {
      const buscaExterna = "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(termo);
      const alternativa = falha.status === 429
        ? '<a class="botao-busca-externa" href="' + buscaExterna + '" target="_blank" rel="noopener noreferrer">Abrir Google Shopping ↗</a>'
        : "";
      resultado.innerHTML = '<p class="erro-pesquisa">' + escapar(falha.message) + '</p>' + alternativa;
    } finally {
      botao.disabled = false;
      botao.textContent = "Pesquisar";
    }
  });
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
    '<section class="pesquisa-materiais">' +
      '<p class="etiqueta-pesquisa">PESQUISA COM IA</p>' +
      '<h3>Encontrar material</h3>' +
      '<p>Digite o componente para procurar opções, preços e lojas.</p>' +
      '<form id="form-pesquisa-material" class="form-pesquisa-material">' +
        '<label for="pesquisa-material">Material</label>' +
        '<div class="linha-pesquisa"><input id="pesquisa-material" maxlength="100" placeholder="Ex.: ESP32 DevKit V1" required>' +
        '<button type="submit">Pesquisar com IA</button><button type="button" class="botao-externo" id="abrir-busca-externa">Pesquisar na web</button></div>' +
      '</form><div id="resultado-materiais" aria-live="polite"></div>' +
    '</section>' +
    bloco("Componentes planejados", lista(componentes)) +
    '<div class="grade-detalhes" style="margin-top:22px">' +
      bloco("Materiais de estrutura e acabamento", esteticos.length ? '<ul class="lista-materiais">' + cardsEsteticos + "</ul>" : "<p>Nenhum material registrado.</p>") +
      bloco("Componentes pesquisados", pesquisados.length ? '<ul class="lista-materiais">' + cardsPesquisados + "</ul>" : "<p>Nenhum componente pesquisado.</p>") +
    "</div>";

  prepararPesquisaMateriais();
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