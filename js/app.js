const formulario = document.querySelector("#formulario-projeto");
const botaoAbrir = document.querySelector("#abrir-formulario");
const botaoFechar = document.querySelector("#fechar-formulario");
const novoProjeto = document.querySelector("#novo-projeto");
const listaProjetos = document.querySelector("#lista-projetos");
const abas = document.querySelectorAll(".aba");
const secoes = document.querySelectorAll(".secao");

let projetos = JSON.parse(localStorage.getItem("projetos")) || [];

function salvarProjetos() {
  localStorage.setItem("projetos", JSON.stringify(projetos));
}

function mostrarProjetos() {
  listaProjetos.innerHTML = "";

  projetos.forEach((projeto, indice) => {
    const pasta = document.createElement("article");
    const inclinacao = indice % 2 === 0 ? "-1deg" : "1deg";

    pasta.className = "pasta";
    pasta.style.setProperty("--inclinacao", inclinacao);

    pasta.innerHTML = `
      <span class="status">${projeto.status}</span>
      <h3>${projeto.nome}</h3>
      <p>${projeto.descricao || "Sem descrição."}</p>
    `;

    listaProjetos.appendChild(pasta);
  });
}

botaoAbrir.addEventListener("click", () => {
  formulario.showModal();
});

botaoFechar.addEventListener("click", () => {
  formulario.close();
});

novoProjeto.addEventListener("submit", (evento) => {
  evento.preventDefault();

  projetos.push({
    id: crypto.randomUUID(),
    nome: document.querySelector("#nome-projeto").value.trim(),
    descricao: document.querySelector("#descricao-projeto").value.trim(),
    status: document.querySelector("#status-projeto").value,
    criadoEm: new Date().toISOString()
  });

  salvarProjetos();
  mostrarProjetos();
  novoProjeto.reset();
  formulario.close();
});

abas.forEach((aba) => {
  aba.addEventListener("click", () => {
    abas.forEach((item) => item.classList.remove("ativa"));
    secoes.forEach((secao) => secao.classList.remove("ativa"));

    aba.classList.add("ativa");
    document.querySelector(`#${aba.dataset.secao}`).classList.add("ativa");
  });
});

mostrarProjetos();
