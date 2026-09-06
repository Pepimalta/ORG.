const tipo = document.body.dataset.tipo;
const fonte = document.body.dataset.fonte;

const configuracoes = {
  projetos: { chave: "org-projetos", singular: "projeto", plural: "projetos" },
  jogos: { chave: "org-jogos", singular: "jogo", plural: "jogos" },
  jornal: { chave: "org-jornal", singular: "matéria", plural: "matérias" }
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

let itensRemotos = [];
let itensLocais = lerLocal(configuracao.chave, []);
let idsOcultos = lerLocal(configuracao.chave + "-ocultos", []);

function lerLocal(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : padrao;
  } catch {
    return padrao;
  }
}

function salvarLocal() {
  localStorage.setItem(configuracao.chave, JSON.stringify(itensLocais));
  localStorage.setItem(configuracao.chave + "-ocultos", JSON.stringify(idsOcultos));
}

function normalizarDados(dados) {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.[tipo])) return dados[tipo];
  if (tipo === "jornal" && Array.isArray(dados?.materias)) return dados.materias;
  if (tipo === "jornal" && Array.isArray(dados?.edicoes)) return dados.edicoes;
  return [];
}

async function carregarArquivo() {
  if (!fonte) return;

  try {
    const resposta = await fetch(fonte + "?v=" + Date.now(), { cache: "no-store" });
    if (!resposta.ok) throw new Error("Arquivo não encontrado");
    const texto = await resposta.text();
    const dados = texto.trim() ? JSON.parse(texto) : [];
    itensRemotos = normalizarDados(dados).map(item => ({ ...item, origem: "github" }));
  } catch (erro) {
    console.error("Não foi possível carregar " + fonte, erro);
    itensRemotos = [];
  }
}

function todosOsItens() {
  const remotosVisiveis = itensRemotos.filter(item => !idsOcultos.includes(item.id));
  return [...itensLocais, ...remotosVisiveis];
}

function criarIdentificador() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random();
}

function formatarData(valor) {
  if (!valor) return "Salvo no arquivo";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function descricaoDoItem(item) {
  return item.descricao ||
    item.objetivo ||
    item.resumo ||
    item.inspiracao?.objetivo_visual ||
    "Sem descrição.";
}

function criarCartao(item) {
  const cartao = document.createElement("article");
  cartao.className = "cartao";

  const status = document.createElement("span");
  status.className = "status";
  status.textContent = item.status || "Registrado";

  const titulo = document.createElement("h3");
  titulo.textContent = item.nome || item.titulo || "Sem título";

  const descricao = document.createElement("p");
  descricao.className = "descricao-cartao";
  descricao.textContent = descricaoDoItem(item);

  const rodape = document.createElement("div");
  rodape.className = "rodape-cartao";

  const data = document.createElement("span");
  data.className = "data-item";
  data.textContent = formatarData(item.criadoEm || item.data || item.dataCriacao);

  const excluir = document.createElement("button");
  excluir.className = "botao-excluir";
  excluir.type = "button";
  excluir.textContent = "Excluir";
  excluir.addEventListener("click", () => excluirItem(item));

  rodape.append(data, excluir);
  cartao.append(status, titulo, descricao, rodape);
  return cartao;
}

function mostrarItens() {
  const itens = todosOsItens();
  lista.replaceChildren(...itens.map(criarCartao));
  listaVazia.classList.toggle("escondida", itens.length > 0);
  contador.textContent = itens.length + " " +
    (itens.length === 1 ? configuracao.singular : configuracao.plural);
}

function abrirFormulario() {
  formulario.reset();
  dialogo.showModal();
  campoNome.focus();
}

function fecharFormulario() {
  dialogo.close();
  formulario.reset();
}

function adicionarItem(evento) {
  evento.preventDefault();
  const nome = campoNome.value.trim();
  if (!nome) return campoNome.focus();

  itensLocais.unshift({
    id: criarIdentificador(),
    nome,
    descricao: campoDescricao.value.trim(),
    status: campoStatus.value,
    criadoEm: new Date().toISOString(),
    origem: "local"
  });

  salvarLocal();
  mostrarItens();
  fecharFormulario();
}

function excluirItem(item) {
  const nome = item.nome || item.titulo || "este item";
  if (!confirm('Excluir "' + nome + '" desta visualização?')) return;

  if (item.origem === "github") {
    if (!idsOcultos.includes(item.id)) idsOcultos.push(item.id);
  } else {
    itensLocais = itensLocais.filter(registro => registro.id !== item.id);
  }

  salvarLocal();
  mostrarItens();
}

botaoAbrir?.addEventListener("click", abrirFormulario);
botaoFechar?.addEventListener("click", fecharFormulario);
botaoCancelar?.addEventListener("click", fecharFormulario);
formulario?.addEventListener("submit", adicionarItem);
dialogo?.addEventListener("click", evento => {
  if (evento.target === dialogo) fecharFormulario();
});

(async function iniciar() {
  await carregarArquivo();
  mostrarItens();
})();