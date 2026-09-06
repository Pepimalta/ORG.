const tipo = document.body.dataset.tipo;

const configuracoes = {
  projetos: {
    chave: "org-projetos",
    singular: "projeto",
    plural: "projetos"
  },

  jogos: {
    chave: "org-jogos",
    singular: "jogo",
    plural: "jogos"
  },

  jornal: {
    chave: "org-jornal",
    singular: "matéria",
    plural: "matérias"
  }
};

const configuracao = configuracoes[tipo];

const botaoAbrir = document.querySelector("#abrir-formulario");
const botaoFechar = document.querySelector("#fechar-formulario");
const botaoCancelar = document.querySelector("#cancelar-formulario");
const dialogo = document.querySelector("#formulario-dialogo");
const formulario = document.querySelector("#formulario-item");
const campoNome = document.querySelector("#nome-item");
const campoDescricao = document.querySelector("#descricao-item");
const campoStatus = document.querySelector("#status-item");
const lista = document.querySelector("#lista-itens");
const listaVazia = document.querySelector("#lista-vazia");
const contador = document.querySelector("#contador");

let itens = carregarItens();

function carregarItens() {
  if (!configuracao) {
    return [];
  }

  try {
    const dadosSalvos = localStorage.getItem(configuracao.chave);
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
  } catch (erro) {
    console.error("Não foi possível carregar os dados:", erro);
    return [];
  }
}

function salvarItens() {
  localStorage.setItem(
    configuracao.chave,
    JSON.stringify(itens)
  );
}

function criarIdentificador() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function formatarData(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(data));
}

function atualizarContador() {
  const quantidade = itens.length;
  const palavra = quantidade === 1
    ? configuracao.singular
    : configuracao.plural;

  contador.textContent = `${quantidade} ${palavra}`;
}

function criarElementoCartao(item) {
  const cartao = document.createElement("article");
  cartao.className = "cartao";

  const status = document.createElement("span");
  status.className = "status";
  status.textContent = item.status;

  const titulo = document.createElement("h3");
  titulo.textContent = item.nome;

  const descricao = document.createElement("p");
  descricao.className = "descricao-cartao";
  descricao.textContent = item.descricao || "Sem descrição.";

  const rodape = document.createElement("div");
  rodape.className = "rodape-cartao";

  const data = document.createElement("span");
  data.className = "data-item";
  data.textContent = formatarData(item.criadoEm);

  const botaoExcluir = document.createElement("button");
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.type = "button";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.setAttribute(
    "aria-label",
    `Excluir ${configuracao.singular} ${item.nome}`
  );

  botaoExcluir.addEventListener("click", () => {
    excluirItem(item.id);
  });

  rodape.append(data, botaoExcluir);
  cartao.append(status, titulo, descricao, rodape);

  return cartao;
}

function mostrarItens() {
  lista.replaceChildren();

  itens.forEach((item) => {
    lista.appendChild(criarElementoCartao(item));
  });

  listaVazia.classList.toggle("escondida", itens.length > 0);
  atualizarContador();
}

function abrirFormulario() {
  formulario.reset();
  dialogo.showModal();

  setTimeout(() => {
    campoNome.focus();
  }, 50);
}

function fecharFormulario() {
  dialogo.close();
  formulario.reset();
}

function excluirItem(id) {
  const item = itens.find((registro) => registro.id === id);

  if (!item) {
    return;
  }

  const confirmar = window.confirm(
    `Excluir ${configuracao.singular} "${item.nome}"?`
  );

  if (!confirmar) {
    return;
  }

  itens = itens.filter((registro) => registro.id !== id);

  salvarItens();
  mostrarItens();
}

function adicionarItem(evento) {
  evento.preventDefault();

  const nome = campoNome.value.trim();
  const descricao = campoDescricao.value.trim();
  const status = campoStatus.value;

  if (!nome) {
    campoNome.focus();
    return;
  }

  const novoItem = {
    id: criarIdentificador(),
    nome,
    descricao,
    status,
    criadoEm: new Date().toISOString()
  };

  itens.unshift(novoItem);

  salvarItens();
  mostrarItens();
  fecharFormulario();
}

botaoAbrir.addEventListener("click", abrirFormulario);
botaoFechar.addEventListener("click", fecharFormulario);
botaoCancelar.addEventListener("click", fecharFormulario);
formulario.addEventListener("submit", adicionarItem);

dialogo.addEventListener("click", (evento) => {
  if (evento.target === dialogo) {
    fecharFormulario();
  }
});

mostrarItens();
